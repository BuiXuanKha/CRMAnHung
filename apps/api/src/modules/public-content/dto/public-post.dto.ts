import { Transform } from 'class-transformer';
import {
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

const POST_CATEGORIES = [
  'tin-tuc',
  'du-an',
  'kien-thuc',
  'kinh-nghiem',
  'lien-he',
  'chinh-sach',
] as const;

const POST_STATUSES = ['DRAFT', 'PUBLISHED'] as const;

export class CreatePublicPostDto {
  @IsString()
  @MinLength(1, { message: 'Nhập tiêu đề bài viết' })
  @MaxLength(160, { message: 'Tiêu đề tối đa 160 ký tự' })
  title!: string;

  @IsIn([...POST_CATEGORIES], { message: 'Chuyên mục không hợp lệ' })
  category!: (typeof POST_CATEGORIES)[number];

  @IsIn([...POST_STATUSES], { message: 'Trạng thái không hợp lệ' })
  status!: (typeof POST_STATUSES)[number];

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @ValidateIf((_, v) => v != null)
  @IsString()
  @MaxLength(500, { message: 'URL ảnh bìa quá dài' })
  coverImageUrl?: string | null;

  @IsOptional()
  @IsString()
  bodyHtml?: string;

  @IsOptional()
  @IsString()
  @MaxLength(320)
  excerpt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  metaDescription?: string;
}

export class SetPublicPostStatusDto {
  @IsIn([...POST_STATUSES], { message: 'Trạng thái không hợp lệ' })
  status!: (typeof POST_STATUSES)[number];
}
