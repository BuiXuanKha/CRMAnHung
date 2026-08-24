import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateAdminUnitDto } from './dto/admin-units.dto';

function normalizeName(name: string): string {
  return String(name || '').trim().replace(/\s+/g, ' ');
}

@Injectable()
export class AdminUnitsService {
  constructor(private readonly prisma: PrismaService) {}

  async listProvinces(includeHidden = false) {
    const items = await this.prisma.province.findMany({
      where: includeHidden ? undefined : { isHidden: false },
      orderBy: { name: 'asc' },
    });
    return {
      items: items.map((p) => ({
        id: p.id,
        name: p.name,
        parentId: null,
        isHidden: p.isHidden,
      })),
    };
  }

  async createProvince(employeeId: string, dto: CreateAdminUnitDto) {
    const name = normalizeName(dto.name);
    if (!name) throw new BadRequestException('Nhập tên.');
    await this.assertProvinceNameFree(name);
    const row = await this.prisma.province.create({
      data: {
        name,
        createdByEmployeeId: employeeId,
      },
    });
    return {
      item: {
        id: row.id,
        name: row.name,
        parentId: null,
        isHidden: row.isHidden,
      },
    };
  }

  async listDistricts(provinceId: string, includeHidden = false) {
    if (!provinceId) throw new BadRequestException('Thiếu provinceId.');
    const province = await this.prisma.province.findFirst({
      where: { id: provinceId, ...(includeHidden ? {} : { isHidden: false }) },
    });
    if (!province) throw new NotFoundException('Không tìm thấy tỉnh.');
    const items = await this.prisma.district.findMany({
      where: {
        provinceId,
        ...(includeHidden ? {} : { isHidden: false }),
      },
      orderBy: { name: 'asc' },
    });
    return {
      items: items.map((d) => ({
        id: d.id,
        name: d.name,
        parentId: d.provinceId,
        isHidden: d.isHidden,
      })),
    };
  }

  async createDistrict(employeeId: string, dto: CreateAdminUnitDto) {
    const name = normalizeName(dto.name);
    const parentId = String(dto.parentId || '').trim();
    if (!name) throw new BadRequestException('Nhập tên.');
    if (!parentId) throw new BadRequestException('Thiếu tỉnh cha (parentId).');
    const province = await this.prisma.province.findFirst({
      where: { id: parentId, isHidden: false },
    });
    if (!province) throw new NotFoundException('Không tìm thấy tỉnh.');
    await this.assertDistrictNameFree(parentId, name);
    const row = await this.prisma.district.create({
      data: {
        provinceId: parentId,
        name,
        createdByEmployeeId: employeeId,
      },
    });
    return {
      item: {
        id: row.id,
        name: row.name,
        parentId: row.provinceId,
        isHidden: row.isHidden,
      },
    };
  }

  async listWards(districtId: string, includeHidden = false) {
    if (!districtId) throw new BadRequestException('Thiếu districtId / parentId.');
    const district = await this.prisma.district.findFirst({
      where: { id: districtId, ...(includeHidden ? {} : { isHidden: false }) },
    });
    if (!district) throw new NotFoundException('Không tìm thấy huyện.');
    const items = await this.prisma.ward.findMany({
      where: {
        districtId,
        ...(includeHidden ? {} : { isHidden: false }),
      },
      orderBy: { name: 'asc' },
    });
    return {
      items: items.map((w) => ({
        id: w.id,
        name: w.name,
        parentId: w.districtId,
        isHidden: w.isHidden,
      })),
    };
  }

  async createWard(employeeId: string, dto: CreateAdminUnitDto) {
    const name = normalizeName(dto.name);
    const parentId = String(dto.parentId || '').trim();
    if (!name) throw new BadRequestException('Nhập tên.');
    if (!parentId) throw new BadRequestException('Thiếu huyện cha (parentId).');
    const district = await this.prisma.district.findFirst({
      where: { id: parentId, isHidden: false },
    });
    if (!district) throw new NotFoundException('Không tìm thấy huyện.');
    await this.assertWardNameFree(parentId, name);
    const row = await this.prisma.ward.create({
      data: {
        districtId: parentId,
        name,
        createdByEmployeeId: employeeId,
      },
    });
    return {
      item: {
        id: row.id,
        name: row.name,
        parentId: row.districtId,
        isHidden: row.isHidden,
      },
    };
  }

  private async assertProvinceNameFree(name: string) {
    const existing = await this.prisma.province.findFirst({
      where: { isHidden: false, name: { equals: name, mode: 'insensitive' } },
    });
    if (existing) {
      throw new BadRequestException('Tỉnh / thành phố này đã có.');
    }
  }

  private async assertDistrictNameFree(provinceId: string, name: string) {
    const existing = await this.prisma.district.findFirst({
      where: {
        provinceId,
        isHidden: false,
        name: { equals: name, mode: 'insensitive' },
      },
    });
    if (existing) {
      throw new BadRequestException('Huyện / quận này đã có trong tỉnh đã chọn.');
    }
  }

  private async assertWardNameFree(districtId: string, name: string) {
    const existing = await this.prisma.ward.findFirst({
      where: {
        districtId,
        isHidden: false,
        name: { equals: name, mode: 'insensitive' },
      },
    });
    if (existing) {
      throw new BadRequestException('Xã / phường này đã có trong huyện đã chọn.');
    }
  }
}
