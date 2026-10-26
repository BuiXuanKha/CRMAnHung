import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { RequestUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';
import {
  AddVideoSceneDto,
  ReorderVideoScenesDto,
  UpdateVideoSceneDto,
} from './dto/video-studio.dto';
import { DEFAULT_SCENE_KINDS, sceneDisplayTitle } from './video-studio-labels';
import { mapVideoProject } from './video-studio-mapper';
import { VideoStudioNarrationService } from './video-studio-narration.service';
import { VideoStudioTtsService } from './video-studio-tts.service';
import { VideoStudioRenderService } from './video-studio-render.service';

const MAX_SCENES = 12;
const SCENE_DURATION_SEC = 10;
export const VIDEO_RAW_MAX_BYTES = 80 * 1024 * 1024;

@Injectable()
export class VideoStudioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly narration: VideoStudioNarrationService,
    private readonly tts: VideoStudioTtsService,
    private readonly render: VideoStudioRenderService,
  ) {}

  async getOrCreateForLodat(user: RequestUser, lodatId: string) {
    await this.requireLodatAccess(user, lodatId);

    const open = await this.prisma.videoProject.findFirst({
      where: {
        lodatId,
        createdByEmployeeId: user.id,
        status: { in: ['DRAFT', 'PROCESSING', 'FAILED'] },
      },
      orderBy: { updatedAt: 'desc' },
      include: { scenes: true },
    });

    if (open) {
      return this.toResponse(open);
    }

    const created = await this.prisma.videoProject.create({
      data: {
        lodatId,
        createdByEmployeeId: user.id,
        status: 'DRAFT',
        scenes: {
          create: DEFAULT_SCENE_KINDS.map((kind, sortOrder) => ({
            kind,
            sortOrder,
            status: 'draft',
          })),
        },
      },
      include: { scenes: true },
    });

    return this.toResponse(created);
  }

  async getProject(user: RequestUser, projectId: string) {
    const row = await this.loadProject(user, projectId);
    return this.toResponse(row);
  }

  async updateScene(
    user: RequestUser,
    projectId: string,
    sceneId: string,
    dto: UpdateVideoSceneDto,
  ) {
    await this.loadProject(user, projectId);
    const scene = await this.prisma.videoScene.findFirst({
      where: { id: sceneId, projectId },
    });
    if (!scene) {
      throw new NotFoundException('Không tìm thấy cảnh.');
    }

    await this.prisma.videoScene.update({
      where: { id: sceneId },
      data: {
        narrationText: dto.narrationText,
        customLabel: dto.customLabel,
        status: dto.status,
      },
    });

    return this.getProject(user, projectId);
  }

  async addScene(user: RequestUser, projectId: string, dto: AddVideoSceneDto) {
    const project = await this.loadProject(user, projectId);
    if (project.scenes.length >= MAX_SCENES) {
      throw new BadRequestException('Tối đa 12 cảnh.');
    }
    const sortOrder = project.scenes.length;
    await this.prisma.videoScene.create({
      data: {
        projectId,
        kind: dto.kind,
        customLabel: dto.customLabel?.trim() || null,
        sortOrder,
        status: 'draft',
      },
    });
    return this.getProject(user, projectId);
  }

  async reorderScenes(
    user: RequestUser,
    projectId: string,
    dto: ReorderVideoScenesDto,
  ) {
    const project = await this.loadProject(user, projectId);
    const ids = new Set(project.scenes.map((s) => s.id));
    if (dto.sceneIds.length !== project.scenes.length) {
      throw new BadRequestException('Danh sách cảnh không khớp dự án.');
    }
    for (const id of dto.sceneIds) {
      if (!ids.has(id)) {
        throw new BadRequestException('Cảnh không thuộc dự án.');
      }
    }

    await this.prisma.$transaction(
      dto.sceneIds.map((id, sortOrder) =>
        this.prisma.videoScene.update({
          where: { id },
          data: { sortOrder },
        }),
      ),
    );

    return this.getProject(user, projectId);
  }

  async uploadRawVideo(
    user: RequestUser,
    projectId: string,
    sceneId: string,
    file: { buffer: Buffer; mimetype: string; originalname?: string; size?: number },
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Thiếu file video.');
    }
    const size = file.size ?? file.buffer.length;
    if (size > VIDEO_RAW_MAX_BYTES) {
      throw new BadRequestException('Video tối đa 80MB.');
    }
    const mime = file.mimetype?.toLowerCase() ?? '';
    if (!mime.startsWith('video/')) {
      throw new BadRequestException('File phải là video.');
    }

    await this.loadProject(user, projectId);
    const scene = await this.prisma.videoScene.findFirst({
      where: { id: sceneId, projectId },
    });
    if (!scene) {
      throw new NotFoundException('Không tìm thấy cảnh.');
    }

    const ext = file.originalname?.match(/\.[a-z0-9]+$/i)?.[0] ?? '.mp4';
    const { objectKey } = await this.storage.uploadPrivate({
      folder: `video-studio/${projectId}/${sceneId}`,
      buffer: file.buffer,
      contentType: mime || 'video/mp4',
      originalName: `raw${ext}`,
    });

    await this.prisma.videoScene.update({
      where: { id: sceneId },
      data: { rawVideoObjectKey: objectKey },
    });

    return this.getProject(user, projectId);
  }

  async generateNarration(
    user: RequestUser,
    projectId: string,
    sceneId: string,
  ) {
    const project = await this.loadProject(user, projectId);
    const scene = project.scenes.find((s) => s.id === sceneId);
    if (!scene) {
      throw new NotFoundException('Không tìm thấy cảnh.');
    }

    const lodat = await this.prisma.lodat.findUnique({
      where: { id: project.lodatId },
      include: {
        address: {
          include: {
            ward: { include: { district: { include: { province: true } } } },
          },
        },
        projectLot: {
          include: {
            address: {
              include: {
                ward: { include: { district: { include: { province: true } } } },
              },
            },
          },
        },
      },
    });
    if (!lodat) {
      throw new NotFoundException('Không tìm thấy lô đất.');
    }

    const title =
      lodat.title?.trim() ||
      lodat.projectLot?.title?.trim() ||
      'Lô đất';
    const addr = lodat.address ?? lodat.projectLot?.address;
    const locationLine = addr
      ? [
          addr.detail,
          addr.ward?.name,
          addr.ward?.district?.name,
          addr.ward?.district?.province?.name,
        ]
          .filter(Boolean)
          .join(', ')
      : '';

    const sceneTitle = sceneDisplayTitle(scene.kind, scene.customLabel);
    const { narrationText, aiNotes } = await this.narration.generate({
      sceneKind: scene.kind,
      sceneTitle,
      lodatTitle: title,
      locationLine,
      areaM2: lodat.areaM2,
      frontageM: lodat.frontageM,
      note: lodat.note,
    });

    await this.prisma.videoScene.update({
      where: { id: sceneId },
      data: { narrationText, aiNotes },
    });

    return this.getProject(user, projectId);
  }

  async exportProject(user: RequestUser, projectId: string) {
    const project = await this.loadProject(user, projectId);
    if (project.status === 'PROCESSING') {
      throw new BadRequestException('Dự án đang xuất — vui lòng đợi.');
    }

    const scenes = [...project.scenes].sort((a, b) => a.sortOrder - b.sortOrder);
    const approved = scenes.filter((s) => s.status === 'approved');
    if (approved.length === 0) {
      throw new BadRequestException('Cần duyệt ít nhất một cảnh trước khi xuất.');
    }
    for (const s of approved) {
      if (!s.rawVideoObjectKey) {
        throw new BadRequestException(
          `Cảnh «${sceneDisplayTitle(s.kind, s.customLabel)}» chưa có video thô.`,
        );
      }
      if (!s.narrationText.trim()) {
        throw new BadRequestException(
          `Cảnh «${sceneDisplayTitle(s.kind, s.customLabel)}» chưa có lời thuyết minh.`,
        );
      }
    }

    await this.prisma.videoProject.update({
      where: { id: projectId },
      data: { status: 'PROCESSING', exportError: null },
    });

    try {
      const sceneMp4Urls: string[] = [];
      const durations: number[] = [];

      for (const scene of approved) {
        const videoUrl = await this.storage.getPrivateSignedUrl(
          scene.rawVideoObjectKey!,
          60 * 60,
        );
        const audioBuf = await this.tts.synthesize(scene.narrationText);
        const audioKey = (
          await this.storage.uploadPrivate({
            folder: `video-studio/${projectId}/${scene.id}/tts`,
            buffer: audioBuf,
            contentType: 'audio/mpeg',
            originalName: 'voice.mp3',
          })
        ).objectKey;
        const audioUrl = await this.storage.getPrivateSignedUrl(audioKey, 60 * 60);

        const sceneMp4 = await this.render.renderVerticalScene({
          videoUrl,
          audioUrl,
          durationSec: SCENE_DURATION_SEC,
        });
        sceneMp4Urls.push(sceneMp4);
        durations.push(SCENE_DURATION_SEC);
      }

      const finalUrl =
        sceneMp4Urls.length === 1
          ? sceneMp4Urls[0]!
          : await this.render.renderFinalMontage(sceneMp4Urls, durations);

      const mp4Res = await fetch(finalUrl);
      if (!mp4Res.ok) {
        throw new BadRequestException('Không tải được file MP4 từ Creatomate.');
      }
      const mp4Buf = Buffer.from(await mp4Res.arrayBuffer());
      const objectKey = `video-exports/${projectId}.mp4`;
      await this.storage.uploadPublicAtKey(objectKey, {
        buffer: mp4Buf,
        contentType: 'video/mp4',
        contentFileName: `an-hung-land-${project.lodatId.slice(0, 8)}.mp4`,
      });

      await this.prisma.videoProject.update({
        where: { id: projectId },
        data: {
          status: 'COMPLETED',
          exportObjectKey: objectKey,
          exportError: null,
        },
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Xuất video thất bại.';
      await this.prisma.videoProject.update({
        where: { id: projectId },
        data: { status: 'FAILED', exportError: message.slice(0, 2000) },
      });
      throw err;
    }

    return this.getProject(user, projectId);
  }

  private async loadProject(user: RequestUser, projectId: string) {
    const row = await this.prisma.videoProject.findUnique({
      where: { id: projectId },
      include: { scenes: true },
    });
    if (!row || row.createdByEmployeeId !== user.id) {
      throw new NotFoundException('Không tìm thấy dự án video.');
    }
    await this.requireLodatAccess(user, row.lodatId);
    return row;
  }

  private async requireLodatAccess(user: RequestUser, lodatId: string) {
    const lodat = await this.prisma.lodat.findUnique({
      where: { id: lodatId },
      select: { createdByEmployeeId: true },
    });
    if (!lodat) {
      throw new NotFoundException('Không tìm thấy lô đất.');
    }
    if (user.role !== 'ADMIN' && lodat.createdByEmployeeId !== user.id) {
      throw new NotFoundException('Không tìm thấy lô đất.');
    }
  }

  private toResponse(row: Awaited<ReturnType<typeof this.loadProject>>) {
    let exportDownloadUrl: string | null = null;
    if (row.exportObjectKey && row.status === 'COMPLETED') {
      try {
        exportDownloadUrl = this.storage.publicUrl(row.exportObjectKey);
      } catch {
        exportDownloadUrl = null;
      }
    }
    return mapVideoProject(row, exportDownloadUrl);
  }
}
