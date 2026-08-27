import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

function emptyToNull(value: unknown): unknown {
  if (value === '') return null;
  return value;
}

export class SetPublicLotPublishedDto {
  @IsBoolean()
  isPublished!: boolean;
}

export class UpdatePublicListingDraftDto {
  @IsString()
  @MinLength(1, { message: 'Nhập tiêu đề bài đăng' })
  @MaxLength(160, { message: 'Tiêu đề tối đa 160 ký tự' })
  title!: string;

  @IsString()
  @MaxLength(240, { message: 'Địa chỉ quá dài' })
  location!: string;

  @IsIn(['AMOUNT', 'CONTACT'])
  priceMode!: 'AMOUNT' | 'CONTACT';

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @ValidateIf((_, v) => v != null)
  @IsString()
  @MaxLength(80, { message: 'Giá công khai quá dài' })
  priceLabel?: string | null;

  @IsOptional()
  @IsString()
  bodyHtml?: string;
}
