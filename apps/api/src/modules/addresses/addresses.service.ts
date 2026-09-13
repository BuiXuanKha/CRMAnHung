import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';
import {
  deletePublicOgJpegForWebp,
  ensurePublicOgJpegForWebp,
} from '../../storage/ensure-public-og-jpeg';
import type {
  CreateAddressDto,
  ImportProjectLotRowDto,
  UpdateAddressDto,
} from './dto/address.dto';
import { uniqueSeoAddressImageKey } from '../lodats/lodat-seo-image-upload';
import { importProjectLotsForAddress } from './import-project-lots';

type WardChain = {
  wardId: string;
  districtId: string;
  provinceId: string;
  wardName: string;
  districtName: string;
  provinceName: string;
};

@Injectable()
export class AddressesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  private publicUrl(objectKey: string | null | undefined): string | null {
    if (!objectKey) return null;
    if (!this.storage.isConfigured()) return null;
    return this.storage.publicUrl(objectKey);
  }

  private async resolveWardChain(wardIdRaw: string): Promise<WardChain> {
    const wardId = String(wardIdRaw || '').trim();
    if (!wardId) throw new BadRequestException('Thiếu Xã / Phường (wardId).');
    const row = await this.prisma.ward.findFirst({
      where: { id: wardId, isHidden: false },
      include: {
        district: {
          include: { province: true },
        },
      },
    });
    if (!row || row.district.isHidden || row.district.province.isHidden) {
      throw new BadRequestException(
        'Xã đã chọn không tồn tại, đã bị ẩn, hoặc huyện/tỉnh cha bị ẩn.',
      );
    }
    return {
      wardId: row.id,
      districtId: row.districtId,
      provinceId: row.district.provinceId,
      wardName: row.name,
      districtName: row.district.name,
      provinceName: row.district.province.name,
    };
  }

  private mapAddressRow(
    row: {
      id: string;
      kind: string;
      detail: string | null;
      description: string | null;
      provinceId: string;
      districtId: string;
      wardId: string;
      isHidden: boolean;
      createdAt: Date;
      updatedAt: Date;
      province?: { name: string; isHidden: boolean } | null;
      district?: { name: string; isHidden: boolean } | null;
      ward?: { name: string; isHidden: boolean } | null;
      _count?: { lodats: number; images: number; projectLots?: number };
      images?: { objectKey: string }[];
    },
  ) {
    const coverKey = row.images?.[0]?.objectKey ?? null;
    const isProject = row.kind === 'PROJECT';
    const lodatCount = isProject
      ? (row._count?.projectLots ?? 0)
      : (row._count?.lodats ?? 0);
    return {
      id: row.id,
      kind: row.kind as 'REGULAR' | 'PROJECT',
      detail: row.detail,
      description: row.description,
      provinceId: row.provinceId,
      districtId: row.districtId,
      wardId: row.wardId,
      province: row.province && !row.province.isHidden ? row.province.name : null,
      district: row.district && !row.district.isHidden ? row.district.name : null,
      ward: row.ward && !row.ward.isHidden ? row.ward.name : null,
      isHidden: row.isHidden,
      lodatCount,
      imageCount: row._count?.images ?? 0,
      coverImageUrl: this.publicUrl(coverKey),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async list(query: {
    keyword?: string;
    kind?: 'REGULAR' | 'PROJECT';
    includeHidden?: boolean;
    withoutLodats?: boolean;
  }) {
    const where: Prisma.AddressWhereInput = {};
    if (!query.includeHidden) where.isHidden = false;
    if (query.kind) where.kind = query.kind;

    if (query.withoutLodats) {
      if (query.kind && query.kind !== 'PROJECT') {
        throw new BadRequestException('withoutLodats chỉ áp dụng khi kind=PROJECT.');
      }
      where.kind = 'PROJECT';
      where.projectLots = { none: {} };
    }

    const keyword = String(query.keyword || '').trim();
    if (keyword) {
      where.OR = [
        { detail: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
        { province: { name: { contains: keyword, mode: 'insensitive' } } },
        { district: { name: { contains: keyword, mode: 'insensitive' } } },
        { ward: { name: { contains: keyword, mode: 'insensitive' } } },
      ];
    }

    // Không cắt trang — trả hết địa chỉ khớp filter (BUG-053: trần 500 làm mất địa chỉ cũ).
    const [rows, total] = await Promise.all([
      this.prisma.address.findMany({
        where,
        include: {
          province: true,
          district: true,
          ward: true,
          _count: { select: { lodats: true, images: true, projectLots: true } },
          images: {
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
            take: 1,
            select: { objectKey: true },
          },
        },
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      }),
      this.prisma.address.count({ where }),
    ]);

    const items = rows.map((r) => this.mapAddressRow(r));
    return { items, total };
  }

  async getById(id: string) {
    const row = await this.prisma.address.findUnique({
      where: { id },
      include: {
        province: true,
        district: true,
        ward: true,
        _count: { select: { lodats: true, images: true, projectLots: true } },
        images: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        },
      },
    });
    if (!row) throw new NotFoundException('Không tìm thấy địa chỉ.');
    const base = this.mapAddressRow(row);
    return {
      ...base,
      images: row.images.map((img) => ({
        id: img.id,
        objectKey: img.objectKey,
        url: this.publicUrl(img.objectKey),
        sortOrder: img.sortOrder,
        createdAt: img.createdAt.toISOString(),
      })),
    };
  }

  async create(employeeId: string, dto: CreateAddressDto) {
    const chain = await this.resolveWardChain(dto.wardId);
    const detail = String(dto.detail || '').trim() || null;
    if (dto.kind === 'PROJECT' && !detail) {
      throw new BadRequestException('Nhập Tên dự án.');
    }
    const row = await this.prisma.address.create({
      data: {
        kind: dto.kind,
        detail,
        description: String(dto.description || '').trim() || null,
        provinceId: chain.provinceId,
        districtId: chain.districtId,
        wardId: chain.wardId,
        createdByEmployeeId: employeeId,
      },
      include: {
        province: true,
        district: true,
        ward: true,
        _count: { select: { lodats: true, images: true, projectLots: true } },
        images: { take: 1, select: { objectKey: true } },
      },
    });
    return { item: this.mapAddressRow(row) };
  }

  async update(id: string, dto: UpdateAddressDto) {
    const existing = await this.prisma.address.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Không tìm thấy địa chỉ.');

    const kind = dto.kind ?? (existing.kind as 'REGULAR' | 'PROJECT');
    let provinceId = existing.provinceId;
    let districtId = existing.districtId;
    let wardId = existing.wardId;

    if (dto.wardId) {
      const chain = await this.resolveWardChain(dto.wardId);
      provinceId = chain.provinceId;
      districtId = chain.districtId;
      wardId = chain.wardId;
    }

    const detail =
      dto.detail !== undefined
        ? String(dto.detail || '').trim() || null
        : existing.detail;
    if (kind === 'PROJECT' && !detail) {
      throw new BadRequestException('Nhập Tên dự án.');
    }
    if (kind === 'REGULAR' && existing.kind === 'PROJECT') {
      const imageCount = await this.prisma.addressImage.count({
        where: { addressId: id },
      });
      if (imageCount > 0) {
        throw new BadRequestException(
          'Địa chỉ dự án còn ảnh — gỡ ảnh trước khi đổi sang đất dân.',
        );
      }
    }

    const row = await this.prisma.address.update({
      where: { id },
      data: {
        kind,
        detail,
        description:
          dto.description !== undefined
            ? String(dto.description || '').trim() || null
            : undefined,
        provinceId,
        districtId,
        wardId,
        isHidden: dto.isHidden ?? undefined,
      },
      include: {
        province: true,
        district: true,
        ward: true,
        _count: { select: { lodats: true, images: true, projectLots: true } },
        images: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          take: 1,
          select: { objectKey: true },
        },
      },
    });
    return { item: this.mapAddressRow(row) };
  }

  /** Soft-hide — không hard-delete. */
  async softHide(id: string) {
    const existing = await this.prisma.address.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Không tìm thấy địa chỉ.');
    const row = await this.prisma.address.update({
      where: { id },
      data: { isHidden: true },
      include: {
        province: true,
        district: true,
        ward: true,
        _count: { select: { lodats: true, images: true, projectLots: true } },
        images: { take: 1, select: { objectKey: true } },
      },
    });
    return { item: this.mapAddressRow(row) };
  }

  async importProjectLots(
    addressId: string,
    employeeId: string,
    rows: ImportProjectLotRowDto[],
  ) {
    return importProjectLotsForAddress(this.prisma, addressId, employeeId, rows);
  }

  async listImages(addressId: string) {
    const address = await this.prisma.address.findUnique({ where: { id: addressId } });
    if (!address) throw new NotFoundException('Không tìm thấy địa chỉ.');
    if (address.kind !== 'PROJECT') {
      throw new BadRequestException('Chỉ địa chỉ dự án có ảnh.');
    }
    const images = await this.prisma.addressImage.findMany({
      where: { addressId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return {
      items: images.map((img) => ({
        id: img.id,
        objectKey: img.objectKey,
        url: this.publicUrl(img.objectKey),
        sortOrder: img.sortOrder,
        createdAt: img.createdAt.toISOString(),
      })),
    };
  }

  async addImage(
    addressId: string,
    file: { buffer: Buffer; mimetype: string; originalname?: string },
  ) {
    const address = await this.prisma.address.findUnique({
      where: { id: addressId },
      include: {
        ward: { select: { name: true, isHidden: true } },
        district: { select: { name: true, isHidden: true } },
        province: { select: { name: true, isHidden: true } },
      },
    });
    if (!address) throw new NotFoundException('Không tìm thấy địa chỉ.');
    if (address.kind !== 'PROJECT') {
      throw new BadRequestException('Chỉ địa chỉ dự án được thêm ảnh.');
    }
    if (address.isHidden) {
      throw new BadRequestException('Địa chỉ đã ẩn — không thêm ảnh.');
    }
    const count = await this.prisma.addressImage.count({ where: { addressId } });
    if (count >= 24) {
      throw new BadRequestException('Tối đa 24 ảnh dự án.');
    }
    const location = [
      address.ward && !address.ward.isHidden ? address.ward.name : null,
      address.district && !address.district.isHidden ? address.district.name : null,
      address.province && !address.province.isHidden ? address.province.name : null,
    ]
      .filter(Boolean)
      .join(', ');
    const { objectKey, fileName } = await uniqueSeoAddressImageKey(this.storage, {
      addressId,
      title: address.detail?.trim() || 'du-an',
      location,
      index: count + 1,
      originalName: file.originalname,
      mime: file.mimetype,
    });
    const uploaded = await this.storage.upload({
      folder: `addresses/${addressId}`,
      buffer: file.buffer,
      contentType: file.mimetype,
      originalName: file.originalname,
      objectKey,
      contentFileName: fileName,
    });
    const row = await this.prisma.addressImage.create({
      data: {
        addressId,
        objectKey: uploaded.objectKey,
        sortOrder: count,
      },
    });
    // First project photo is often the lot cover — keep OG JPEG in sync for Zalo/FB.
    if (count === 0) {
      await ensurePublicOgJpegForWebp(this.storage, uploaded.objectKey);
    }
    return {
      item: {
        id: row.id,
        objectKey: row.objectKey,
        url: this.publicUrl(row.objectKey),
        sortOrder: row.sortOrder,
        createdAt: row.createdAt.toISOString(),
      },
    };
  }

  async deleteImage(addressId: string, imageId: string) {
    const image = await this.prisma.addressImage.findFirst({
      where: { id: imageId, addressId },
    });
    if (!image) throw new NotFoundException('Không tìm thấy ảnh.');
    await this.prisma.addressImage.delete({ where: { id: imageId } });
    try {
      await this.storage.delete(image.objectKey, 'public');
      await deletePublicOgJpegForWebp(this.storage, image.objectKey);
    } catch {
      // DB already dropped the row; orphan object is acceptable for now.
    }
    return { ok: true };
  }
}
