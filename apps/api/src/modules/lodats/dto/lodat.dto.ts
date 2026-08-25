import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

function toBool(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (value === true || value === 'true' || value === '1') return true;
  if (value === false || value === 'false' || value === '0') return false;
  return undefined;
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
