import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateHotlineDto } from './dto/create-hotline.dto';
import type { UpdateHotlineDto } from './dto/update-hotline.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
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
