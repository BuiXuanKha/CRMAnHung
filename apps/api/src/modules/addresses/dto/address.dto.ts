import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { PROJECT_LOT_IMPORT_MAX_ROWS } from '@crmanhung/shared';

function toBool(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (value === true || value === 'true' || value === '1') return true;
  if (value === false || value === 'false' || value === '0') return false;
  return undefined;
}

export class ListAddressesQueryDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsIn(['REGULAR', 'PROJECT'])
  kind?: 'REGULAR' | 'PROJECT';

  @IsOptional()
  @IsIn(['0', '1', 'true', 'false'])
  includeHidden?: string;

  /** Chỉ dự án chưa có lô kho (CRM cũ withoutLodats). */
  @IsOptional()
  @Transform(({ value }) => toBool(value))
  @IsBoolean()
  withoutLodats?: boolean;
}

export class CreateAddressDto {
  @IsIn(['REGULAR', 'PROJECT'], { message: 'Loại địa chỉ không hợp lệ.' })
  kind!: 'REGULAR' | 'PROJECT';

  @IsString({ message: 'Chọn Xã / Phường.' })
  @MinLength(1, { message: 'Chọn Xã / Phường.' })
  wardId!: string;

  @IsOptional()
  @IsString({ message: 'Chi tiết địa chỉ không hợp lệ.' })
  @MaxLength(200)
  detail?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;
}

export class UpdateAddressDto {
  @IsOptional()
  @IsIn(['REGULAR', 'PROJECT'])
  kind?: 'REGULAR' | 'PROJECT';

  @IsOptional()
  @IsString()
  @MinLength(1)
  wardId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  detail?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  isHidden?: boolean;
}

function emptyToNull(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const s = String(value).trim();
  return s ? s : null;
}

export class ImportProjectLotRowDto {
  @IsString({ message: 'Thiếu tên lô đất.' })
  @MinLength(1, { message: 'Thiếu tên lô đất.' })
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null) return null;
    if (value === undefined) return undefined;
    return Number(value);
  })
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsNumber({}, { message: 'Diện tích không hợp lệ.' })
  @Min(0, { message: 'Diện tích không được âm.' })
  areaM2?: number | null;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null) return null;
    if (value === undefined) return undefined;
    return Number(value);
  })
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsNumber({}, { message: 'Mặt tiền không hợp lệ.' })
  @Min(0, { message: 'Mặt tiền không được âm.' })
  frontageM?: number | null;

  @IsOptional()
  @Transform(({ value }) => emptyToNull(value))
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  @MaxLength(40)
  direction?: string | null;

  @IsOptional()
  @Transform(({ value }) => emptyToNull(value))
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  @MaxLength(2000)
  note?: string | null;
}

export class ImportProjectLotsDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Danh sách lô import trống.' })
  @ArrayMaxSize(PROJECT_LOT_IMPORT_MAX_ROWS, {
    message: `Tối đa ${PROJECT_LOT_IMPORT_MAX_ROWS} dòng mỗi lần import.`,
  })
  @ValidateNested({ each: true })
  @Type(() => ImportProjectLotRowDto)
  rows!: ImportProjectLotRowDto[];
}
