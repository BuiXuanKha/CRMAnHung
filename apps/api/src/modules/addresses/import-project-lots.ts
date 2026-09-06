import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  LODAT_DIRECTION_OPTIONS,
  PROJECT_LOT_IMPORT_MAX_ROWS,
} from '@crmanhung/shared';
import { PrismaService } from '../../prisma/prisma.service';
import type { ImportProjectLotRowDto } from './dto/address.dto';

const DIRECTION_SET = new Set<string>(LODAT_DIRECTION_OPTIONS);

function toNullableNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Admin import Excel rows into an empty PROJECT address (CRM cũ
 * POST /addresses/:id/lodats/import). Writes `ProjectLot`, not `Lodat`.
 */
export async function importProjectLotsForAddress(
  prisma: PrismaService,
  addressId: string,
  employeeId: string,
  rows: ImportProjectLotRowDto[],
) {
  const address = await prisma.address.findUnique({
    where: { id: addressId },
    select: {
      id: true,
      kind: true,
      isHidden: true,
      _count: { select: { projectLots: true } },
    },
  });
  if (!address || address.isHidden) {
    throw new NotFoundException('Không tìm thấy địa chỉ dự án.');
  }
  if (address.kind !== 'PROJECT') {
    throw new BadRequestException('Chỉ được import lô vào địa chỉ loại Dự án.');
  }
  if (address._count.projectLots > 0) {
    throw new BadRequestException('Chỉ được import vào dự án chưa có lô.');
  }
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new BadRequestException('Danh sách lô import trống.');
  }
  if (rows.length > PROJECT_LOT_IMPORT_MAX_ROWS) {
    throw new BadRequestException(
      `Tối đa ${PROJECT_LOT_IMPORT_MAX_ROWS} dòng mỗi lần import.`,
    );
  }

  const seenTitles = new Set<string>();
  const results: Array<{
    rowIndex: number;
    ok: boolean;
    id?: string;
    title?: string;
    message?: string;
  }> = [];

  await prisma.$transaction(
    async (tx) => {
      for (let i = 0; i < rows.length; i += 1) {
        const rowIndex = i + 1;
        const row = rows[i] ?? {};
        const trimmedTitle = String(row.title || '').trim();

        if (!trimmedTitle) {
          results.push({ rowIndex, ok: false, message: 'Thiếu tên lô đất.' });
          continue;
        }
        if (trimmedTitle.length > 200) {
          results.push({
            rowIndex,
            ok: false,
            title: trimmedTitle,
            message: 'Tên lô đất tối đa 200 ký tự.',
          });
          continue;
        }

        const titleKey = trimmedTitle.toLowerCase();
        if (seenTitles.has(titleKey)) {
          results.push({
            rowIndex,
            ok: false,
            title: trimmedTitle,
            message: 'Trùng tên lô đất trong file.',
          });
          continue;
        }
        seenTitles.add(titleKey);

        const area = toNullableNumber(row.areaM2);
        const frontage = toNullableNumber(row.frontageM);
        if (area != null && area < 0) {
          results.push({
            rowIndex,
            ok: false,
            title: trimmedTitle,
            message: 'Diện tích không được âm.',
          });
          continue;
        }
        if (frontage != null && frontage < 0) {
          results.push({
            rowIndex,
            ok: false,
            title: trimmedTitle,
            message: 'Mặt tiền không được âm.',
          });
          continue;
        }

        const directionValue = String(row.direction || '').trim() || null;
        if (directionValue && !DIRECTION_SET.has(directionValue)) {
          results.push({
            rowIndex,
            ok: false,
            title: trimmedTitle,
            message: `Hướng "${directionValue}" không nằm trong danh sách cho phép.`,
          });
          continue;
        }
        const noteValue = String(row.note || '').trim() || null;

        try {
          const created = await tx.projectLot.create({
            data: {
              addressId,
              title: trimmedTitle,
              areaM2: area,
              frontageM: frontage,
              direction: directionValue,
              note: noteValue,
              createdByEmployeeId: employeeId,
            },
          });
          results.push({
            rowIndex,
            ok: true,
            id: created.id,
            title: trimmedTitle,
          });
        } catch {
          results.push({
            rowIndex,
            ok: false,
            title: trimmedTitle,
            message: 'Không tạo được lô.',
          });
        }
      }
    },
    { timeout: 120_000, maxWait: 15_000 },
  );

  const created = results.filter((r) => r.ok).length;
  return {
    ok: true as const,
    addressId,
    total: results.length,
    created,
    failed: results.length - created,
    results,
  };
}
