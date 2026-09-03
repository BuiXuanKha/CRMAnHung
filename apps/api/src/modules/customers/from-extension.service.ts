import { BadRequestException, Injectable } from '@nestjs/common';
import { fromExtensionDraftSchema } from '@crmanhung/shared';
import type { FromExtensionResult } from '@crmanhung/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';
import type { RequestUser } from '../../common/decorators/current-user.decorator';
import { countPublicImageKeyRefs } from '../../storage/retarget-public-key';
import {
  ingestMessengerChatImage,
  isStableMessengerMessageId,
} from './messenger-image-ingest';
import {
  avatarSourceKeyFromRawMeta,
  resolveAvatarFromScan,
} from './messenger-avatar-ingest';
import {
  fullNameSeed,
  incomingImageUrls,
  isPlaceholder,
  MAX_MESSAGES,
  mergeFacebookRawMeta,
  messageStorageKey,
  originalPathHint,
  parseRawMetaObject,
  parseScan,
  toSender,
  trimText,
  type ExistingMessage,
  type ScanFields,
} from './from-extension-parse';

@Injectable()
export class FromExtensionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async ingest(user: RequestUser, body: unknown): Promise<FromExtensionResult> {
    const parsed = fromExtensionDraftSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException('Payload không hợp lệ.');
    }
    const fields = parseScan(parsed.data);
    if (!fields.threadId && !fields.customerUid) {
      throw new BadRequestException('Thiếu threadId hoặc UID khách.');
    }

    const existing = await this.findExisting(user.id, fields);
    if (existing) {
      await this.touchExisting(existing, fields);
      const stats = await this.appendMessages(existing.id, existing.facebookId, fields);
      return {
        ok: true as const,
        id: existing.id,
        updated: true,
        ...stats,
        message: this.summaryMessage(true, stats),
      };
    }

    const created = await this.createCustomer(user.id, fields);
    const stats = await this.appendMessages(created.id, created.facebookId, fields);
    return {
      ok: true as const,
      id: created.id,
      updated: false,
      ...stats,
      message: stats.messagesAppended
        ? `Đã lưu khách mới (+${stats.messagesAppended} tin).`
        : 'Đã lưu khách mới.',
    };
  }

  private async findExisting(
    employeeId: string,
    fields: ScanFields,
  ): Promise<{ id: string; facebookId: string } | null> {
    if (fields.threadId) {
      const byThread = await this.prisma.customer.findFirst({
        where: {
          employeeId,
          facebook: { threadId: fields.threadId },
        },
        select: { id: true, facebook: { select: { id: true } } },
        orderBy: { createdAt: 'desc' },
      });
      if (byThread?.facebook) {
        return { id: byThread.id, facebookId: byThread.facebook.id };
      }
    }
    if (!fields.customerUid) return null;
    const byUid = await this.prisma.customer.findFirst({
      where: {
        employeeId,
        facebook: { customerUid: fields.customerUid },
      },
      select: { id: true, facebook: { select: { id: true } } },
      orderBy: { createdAt: 'desc' },
    });
    if (!byUid?.facebook) return null;
    return { id: byUid.id, facebookId: byUid.facebook.id };
  }

  private async touchExisting(
    existing: { id: string; facebookId: string },
    fields: ScanFields,
  ): Promise<void> {
    const fb = await this.prisma.customerFacebook.findUnique({
      where: { id: existing.facebookId },
    });
    if (!fb) return;
    const avatar = await this.resolveAvatar(existing.id, fields, fb);
    await this.prisma.customerFacebook.update({
      where: { id: fb.id },
      data: {
        facebookName: fields.customerName || fb.facebookName,
        threadId: fields.threadId || fb.threadId,
        customerUid: fb.customerUid || fields.customerUid || null,
        scanSource: fields.scanSource || fb.scanSource,
        scanSourceLabel: fields.scanSourceLabel || fb.scanSourceLabel,
        employeeFacebookUid: fb.employeeFacebookUid || fields.employeeUid || null,
        avatarUrl: avatar.avatarUrl,
        avatarObjectKey: avatar.avatarObjectKey,
        rawMeta: avatar.rawMeta,
      },
    });
    await this.deletePublicObjectIfOrphan(avatar.previousObjectKey);
    await this.prisma.customer.update({
      where: { id: existing.id },
      data: { updatedAt: new Date() },
    });
  }

  private async createCustomer(
    employeeId: string,
    fields: ScanFields,
  ): Promise<{ id: string; facebookId: string }> {
    const row = await this.prisma.customer.create({
      data: {
        employeeId,
        fullName: fullNameSeed(fields),
        status: 'KHACH_MOI',
        facebook: {
          create: {
            customerUid: fields.customerUid || null,
            threadId: fields.threadId || null,
            facebookName: fields.customerName || null,
            scanSource: fields.scanSource || null,
            scanSourceLabel: fields.scanSourceLabel || null,
            employeeFacebookUid: fields.employeeUid || null,
            rawMeta: mergeFacebookRawMeta(fields.rawMeta, fields.pageUrl),
          },
        },
      },
      select: { id: true, facebook: { select: { id: true } } },
    });
    if (!row.facebook) {
      throw new BadRequestException('Không tạo được hồ sơ Facebook cho khách.');
    }
    const fb = await this.prisma.customerFacebook.findUnique({
      where: { id: row.facebook.id },
    });
    if (fb) {
      const avatar = await this.resolveAvatar(row.id, fields, fb);
      await this.prisma.customerFacebook.update({
        where: { id: fb.id },
        data: {
          avatarUrl: avatar.avatarUrl,
          avatarObjectKey: avatar.avatarObjectKey,
          rawMeta: avatar.rawMeta,
        },
      });
      await this.deletePublicObjectIfOrphan(avatar.previousObjectKey);
    }
    return { id: row.id, facebookId: row.facebook.id };
  }

  private async resolveAvatar(
    customerId: string,
    fields: ScanFields,
    fb: { avatarUrl: string | null; avatarObjectKey: string | null; rawMeta: string | null },
  ): Promise<{
    avatarUrl: string | null;
    avatarObjectKey: string | null;
    rawMeta: string | null;
    previousObjectKey: string | null;
  }> {
    const outcome = await resolveAvatarFromScan(
      this.storage,
      fields.avatarUrl,
      {
        avatarUrl: fb.avatarUrl,
        avatarObjectKey: fb.avatarObjectKey,
        avatarSourceKey: avatarSourceKeyFromRawMeta(fb.rawMeta),
      },
      customerId,
    );
    const rawMeta = mergeFacebookRawMeta(fb.rawMeta || fields.rawMeta, fields.pageUrl, {
      ...parseRawMetaObject(fields.rawMeta),
      ...(outcome.avatarSourceKey ? { avatarSourceKey: outcome.avatarSourceKey } : {}),
    });
    return {
      avatarUrl: outcome.avatarUrl,
      avatarObjectKey: outcome.avatarObjectKey,
      rawMeta,
      previousObjectKey: outcome.previousObjectKey,
    };
  }

  private async deletePublicObjectIfOrphan(objectKey: string | null | undefined): Promise<void> {
    const key = objectKey?.trim();
    if (!key) return;
    const refs = await countPublicImageKeyRefs(this.prisma, key);
    if (refs > 0) return;
    try {
      await this.storage.delete(key, 'public');
    } catch {
      // orphan ok
    }
  }

  private async appendMessages(
    customerId: string,
    facebookId: string,
    fields: ScanFields,
  ): Promise<{
    messagesAppended: number;
    messagesUpdated: number;
    imagesStored: number;
  }> {
    const incoming = (fields.messages ?? []).slice(0, MAX_MESSAGES);
    if (!incoming.length) {
      return { messagesAppended: 0, messagesUpdated: 0, imagesStored: 0 };
    }

    const existingRows = await this.prisma.customerMessengerMessage.findMany({
      where: { customerFacebookId: facebookId },
      include: { images: { select: { objectKey: true } } },
    });
    const byKey = new Map<string, ExistingMessage>();
    const byStable = new Map<string, ExistingMessage>();
    for (const row of existingRows) {
      const key = messageStorageKey({
        id: row.externalMessageId ?? undefined,
        dedupeKey: row.dedupeKey ?? undefined,
        sender: row.sender ?? undefined,
        text: row.body ?? undefined,
      });
      if (!byKey.has(key)) byKey.set(key, row);
      const stable = row.externalMessageId?.trim() ?? '';
      if (isStableMessengerMessageId(stable) && !byStable.has(stable)) {
        byStable.set(stable, row);
      }
    }

    let messagesAppended = 0;
    let messagesUpdated = 0;
    let imagesStored = 0;

    for (let i = 0; i < incoming.length; i += 1) {
      const msg = incoming[i] ?? {};
      const externalId = trimText(msg.id);
      const key = messageStorageKey({
        id: msg.id,
        dedupeKey: msg.dedupeKey,
        sender: msg.sender,
        text: msg.text,
      });
      const found = byKey.get(key) || (externalId ? byStable.get(externalId) : undefined);
      const imageUrls = incomingImageUrls(msg);
      const messageId = externalId || `msg-${i}`;

      if (found) {
        const extra = await this.ingestExtraImages(
          customerId,
          found,
          imageUrls,
          messageId,
          i,
        );
        imagesStored += extra;
        const nextBody = trimText(msg.text);
        const prevBody = (found.body ?? '').trim();
        const betterText =
          Boolean(nextBody) &&
          ((isPlaceholder(prevBody) && !isPlaceholder(nextBody)) ||
            nextBody.length > prevBody.length);
        const nextSender = trimText(msg.sender);
        const betterSender = Boolean(nextSender) && !found.sender;
        if (betterText || betterSender || extra > 0 || found.sortOrder !== i) {
          await this.prisma.customerMessengerMessage.update({
            where: { id: found.id },
            data: {
              body: betterText ? nextBody : found.body,
              sender: betterSender ? toSender(nextSender) : found.sender,
              senderUid: trimText(msg.senderUid) || undefined,
              sortOrder: i,
            },
          });
          messagesUpdated += 1;
        }
        continue;
      }

      const keys = await this.ingestAllImages(customerId, imageUrls, messageId, i);
      imagesStored += keys.length;
      const created = await this.prisma.customerMessengerMessage.create({
        data: {
          customerFacebookId: facebookId,
          externalMessageId: externalId || null,
          body: trimText(msg.text) || null,
          sender: toSender(trimText(msg.sender)),
          senderUid: trimText(msg.senderUid) || null,
          dedupeKey: trimText(msg.dedupeKey) || null,
          sortOrder: i,
          images: {
            create: keys.map((objectKey, imageIndex) => ({
              objectKey,
              sortOrder: imageIndex,
              originalPath: originalPathHint(imageUrls[imageIndex]),
            })),
          },
        },
        include: { images: { select: { objectKey: true } } },
      });
      byKey.set(key, created);
      if (isStableMessengerMessageId(externalId)) byStable.set(externalId, created);
      messagesAppended += 1;
    }

    return { messagesAppended, messagesUpdated, imagesStored };
  }

  private async ingestAllImages(
    customerId: string,
    imageUrls: string[],
    messageId: string,
    sortOrder: number,
  ): Promise<string[]> {
    const keys: string[] = [];
    for (let imageIndex = 0; imageIndex < imageUrls.length; imageIndex += 1) {
      const objectKey = await ingestMessengerChatImage(this.storage, imageUrls[imageIndex], {
        customerId,
        messageId,
        sortOrder,
        imageIndex,
      });
      if (objectKey) keys.push(objectKey);
    }
    return keys;
  }

  private async ingestExtraImages(
    customerId: string,
    found: ExistingMessage,
    imageUrls: string[],
    messageId: string,
    sortOrder: number,
  ): Promise<number> {
    if (imageUrls.length <= found.images.length) return 0;
    let added = 0;
    for (let imageIndex = found.images.length; imageIndex < imageUrls.length; imageIndex += 1) {
      const objectKey = await ingestMessengerChatImage(this.storage, imageUrls[imageIndex], {
        customerId,
        messageId,
        sortOrder,
        imageIndex,
      });
      if (!objectKey) continue;
      await this.prisma.customerMessengerImage.create({
        data: {
          messageId: found.id,
          objectKey,
          sortOrder: imageIndex,
          originalPath: originalPathHint(imageUrls[imageIndex]),
        },
      });
      found.images.push({ objectKey });
      added += 1;
    }
    return added;
  }

  private summaryMessage(
    updated: boolean,
    stats: { messagesAppended: number; messagesUpdated: number },
  ): string {
    if (!updated) return 'Đã lưu khách mới.';
    const appendHint = stats.messagesAppended > 0 ? ` (+${stats.messagesAppended} tin mới)` : '';
    const updateHint =
      stats.messagesUpdated > 0 && !stats.messagesAppended
        ? ` (cập nhật ${stats.messagesUpdated} tin)`
        : '';
    return `Đã cập nhật khách${appendHint}${updateHint}.`;
  }
}
