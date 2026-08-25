import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

function toBool(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (value === true || value === 'true' || value === '1') return true;
  if (value === false || value === 'false' || value === '0') return false;
  return undefined;
}

function emptyToNull(value: unknown): unknown {
  if (value === '') return null;
  return value;
}

export class ListLodatsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  keyword?: string;

  @IsOptional()
  @IsIn(['DANG_BAN', 'TAM_DUNG'])
  status?: 'DANG_BAN' | 'TAM_DUNG';

  @IsOptional()
  @IsIn(['NHA', 'DAT'])
  kind?: 'NHA' | 'DAT';

  @IsOptional()
  @Transform(({ value }) => toBool(value))
  @IsBoolean()
  includePaused?: boolean;

  @IsOptional()
  @Transform(({ value }) => toBool(value))
  @IsBoolean()
  pausedOnly?: boolean;
}

export class UpdateLodatSaleStatusDto {
  @IsIn(['DANG_BAN', 'TAM_DUNG'], { message: 'Trạng thái rao bán không hợp lệ.' })
  status!: 'DANG_BAN' | 'TAM_DUNG';
}

export class UpdateLodatImageRotationDto {
  @Transform(({ value }) => (value === '' || value == null ? value : Number(value)))
  @IsInt({ message: 'Góc xoay không hợp lệ.' })
  rotationDeg!: number;
}

export class ListProjectLotsQueryDto {
  @IsString()
  @MaxLength(60)
  addressId!: string;
}

export class CreateLodatDto {
  @IsString()
  @MaxLength(60)
  customerId!: string;

  @IsOptional()
  @Transform(({ value }) => emptyToNull(value))
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  @MaxLength(60)
  addressId?: string | null;

  @IsOptional()
  @Transform(({ value }) => emptyToNull(value))
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  @MaxLength(60)
  projectLotId?: string | null;

  @IsOptional()
  @Transform(({ value }) => emptyToNull(value))
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  @MaxLength(200)
  title?: string | null;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null) return null;
    if (value === undefined) return undefined;
    return Number(value);
  })
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsNumber()
  areaM2?: number | null;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null) return null;
    if (value === undefined) return undefined;
    return Number(value);
  })
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsNumber()
  frontageM?: number | null;

  @IsOptional()
  @Transform(({ value }) => emptyToNull(value))
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  @MaxLength(40)
  direction?: string | null;

  @IsOptional()
  @IsIn(['NHA', 'DAT'])
  kind?: 'NHA' | 'DAT';

  @IsOptional()
  @Transform(({ value }) => emptyToNull(value))
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  @MaxLength(4000)
  note?: string | null;

  @IsOptional()
  @IsIn(['DANG_BAN', 'TAM_DUNG'])
  status?: 'DANG_BAN' | 'TAM_DUNG';

  @IsOptional()
  @Transform(({ value }) => emptyToNull(value))
  priceVnd?: number | string | null;

  @IsOptional()
  @Transform(({ value }) => emptyToNull(value))
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  @MaxLength(200)
  priceNote?: string | null;

  @IsOptional()
  @Transform(({ value }) => emptyToNull(value))
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  @MaxLength(200)
  brokerFeeNote?: string | null;

  @IsOptional()
  @Transform(({ value }) => emptyToNull(value))
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  @MaxLength(4000)
  mapNote?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  chatImageIds?: string[];
}

export class UpdateLodatDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToNull(value))
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  addressId?: string | null;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null) return null;
    if (value === undefined) return undefined;
    return Number(value);
  })
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsNumber()
  areaM2?: number | null;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null) return null;
    if (value === undefined) return undefined;
    return Number(value);
  })
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsNumber()
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
  @MaxLength(4000)
  note?: string | null;

  @IsOptional()
  @IsIn(['NHA', 'DAT'])
  kind?: 'NHA' | 'DAT';

  @IsOptional()
  @Transform(({ value }) => emptyToNull(value))
  priceVnd?: number | string | null;

  @IsOptional()
  @Transform(({ value }) => emptyToNull(value))
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  @MaxLength(200)
  priceNote?: string | null;

  @IsOptional()
  @Transform(({ value }) => emptyToNull(value))
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  @MaxLength(200)
  brokerFeeNote?: string | null;

  @IsOptional()
  @Transform(({ value }) => emptyToNull(value))
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  @MaxLength(4000)
  mapNote?: string | null;

  @IsOptional()
  @IsIn(['DANG_BAN', 'TAM_DUNG'])
  status?: 'DANG_BAN' | 'TAM_DUNG';
}
