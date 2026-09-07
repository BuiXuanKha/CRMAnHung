import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { countPublicImageKeyRefs } from '../../storage/retarget-public-key';
import { toAdminUser } from './users-view';
import type { CreateHotlineDto } from './dto/create-hotline.dto';
import type { UpdateHotlineDto } from './dto/update-hotline.dto';
import type { CreateUserDto, ResetUserPasswordDto, UpdateUserDto } from './dto/user-admin.dto';

const BCRYPT_ROUNDS = 12;

const userSelect = {
  id: true,
  fullName: true,
  username: true,
  phone: true,
  role: true,
  isActive: true,
  createdAt: true,
  avatarObjectKey: true,
} as const;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async list() {
    const rows = await this.prisma.user.findMany({
      select: userSelect,
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => toAdminUser(row, this.storage));
  }

  async create(dto: CreateUserDto) {
    const username = dto.username.trim().toLowerCase();
    const fullName = dto.fullName.trim();
    const phone = dto.phone.trim();
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    try {
      const row = await this.prisma.user.create({
        data: {
          username,
          fullName,
          phone,
          passwordHash,
          role: dto.role ?? 'STAFF',
          isActive: dto.isActive ?? true,
        },
        select: userSelect,
      });
      return toAdminUser(row, this.storage);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new BadRequestException('Tên đăng nhập đã tồn tại.');
      }
      throw err;
    }
  }

  async update(id: string, dto: UpdateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, isActive: true },
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy người dùng.');
    }

    if (dto.role === 'STAFF' && existing.role === 'ADMIN' && existing.isActive) {
      const adminCount = await this.prisma.user.count({
        where: { role: 'ADMIN', isActive: true },
      });
      if (adminCount <= 1) {
        throw new BadRequestException('Không thể hạ quyền Admin cuối cùng.');
      }
    }

    if (dto.isActive === false && existing.role === 'ADMIN' && existing.isActive) {
      const adminCount = await this.prisma.user.count({
        where: { role: 'ADMIN', isActive: true },
      });
      if (adminCount <= 1) {
        throw new BadRequestException('Không thể vô hiệu hóa Admin cuối cùng.');
      }
    }

    const data: Prisma.UserUpdateInput = {};
    if (dto.username !== undefined) data.username = dto.username.trim().toLowerCase();
    if (dto.fullName !== undefined) data.fullName = dto.fullName.trim();
    if (dto.phone !== undefined) {
      const phone = typeof dto.phone === 'string' ? dto.phone.trim() : '';
      if (!/^0\d{9}$/.test(phone)) {
        throw new BadRequestException(
          'Không được xoá số điện thoại nhân viên — chỉ được đổi sang số hợp lệ (10 số, bắt đầu bằng 0).',
        );
      }
      data.phone = phone;
    }
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Không có thay đổi.');
    }

    try {
      const shouldInvalidateSession =
        dto.isActive === false ||
        (dto.role !== undefined && dto.role !== existing.role);

      const user = await this.prisma.user.update({
        where: { id },
        data: shouldInvalidateSession
          ? { ...data, sessionVersion: { increment: 1 } }
          : data,
        select: userSelect,
      });
      if (shouldInvalidateSession) {
        await this.revokeRefreshTokens(id);
      }
      return toAdminUser(user, this.storage);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new BadRequestException('Tên đăng nhập đã tồn tại.');
      }
      throw err;
    }
  }

  async resetPassword(id: string, dto: ResetUserPasswordDto) {
    const existing = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy người dùng.');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    await this.prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        sessionVersion: { increment: 1 },
      },
    });
    await this.revokeRefreshTokens(id);
    return { ok: true };
  }

  /**
   * Hard-delete is forbidden: User FKs (customers, lots, deals, title, care)
   * must stay. Soft-disable via PATCH `isActive: false`.
   */
  async remove(_id: string) {
    throw new BadRequestException(
      'Không xóa cứng nhân viên. Hãy vô hiệu hóa tài khoản (Sửa → bỏ tick Tài khoản đang hoạt động) để giữ khách, lô, giao dịch, sổ đỏ và chăm sóc.',
    );
  }

  async setAvatar(
    id: string,
    file: { buffer: Buffer; mimetype: string; originalname?: string },
  ) {
    const existing = await this.prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy người dùng.');
    }
    const uploaded = await this.storage.upload({
      folder: `users/avatars/${id}`,
      buffer: file.buffer,
      contentType: file.mimetype,
      originalName: file.originalname,
    });
    const row = await this.prisma.user.update({
      where: { id },
      data: { avatarObjectKey: uploaded.objectKey },
      select: userSelect,
    });
    if (existing.avatarObjectKey && existing.avatarObjectKey !== uploaded.objectKey) {
      await this.deleteAvatarObject(existing.avatarObjectKey);
    }
    return toAdminUser(row, this.storage);
  }

  async removeAvatar(id: string) {
    const existing = await this.prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy người dùng.');
    }
    if (!existing.avatarObjectKey) {
      return toAdminUser(existing, this.storage);
    }
    const row = await this.prisma.user.update({
      where: { id },
      data: { avatarObjectKey: null },
      select: userSelect,
    });
    await this.deleteAvatarObject(existing.avatarObjectKey);
    return toAdminUser(row, this.storage);
  }

  private async deleteAvatarObject(objectKey: string | null | undefined) {
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

  private async revokeRefreshTokens(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async listHotlines(employeeId: string, activeOnly: boolean) {
    const items = await this.prisma.employeeHotline.findMany({
      where: {
        employeeId,
        ...(activeOnly ? { isActive: true } : {}),
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        phone: true,
        label: true,
        isActive: true,
      },
    });
    return { items };
  }

  async createHotline(employeeId: string, dto: CreateHotlineDto) {
    const phone = dto.phone.trim();
    const label = dto.label.trim();
    const last = await this.prisma.employeeHotline.findFirst({
      where: { employeeId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    try {
      return await this.prisma.employeeHotline.create({
        data: {
          employeeId,
          phone,
          label,
          isActive: true,
          sortOrder: (last?.sortOrder ?? -1) + 1,
        },
        select: { id: true, phone: true, label: true, isActive: true },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new BadRequestException('Số hotline này đã có trên tài khoản của bạn.');
      }
      throw err;
    }
  }

  async updateHotline(employeeId: string, id: string, dto: UpdateHotlineDto) {
    const existing = await this.prisma.employeeHotline.findFirst({
      where: { id, employeeId },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy hotline.');
    }
    const data: Prisma.EmployeeHotlineUpdateInput = {};
    if (dto.label !== undefined) data.label = dto.label.trim();
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Không có thay đổi.');
    }
    return this.prisma.employeeHotline.update({
      where: { id },
      data,
      select: { id: true, phone: true, label: true, isActive: true },
    });
  }
}
