import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class PostGptRequestDto {
  @IsString()
  @MinLength(1, { message: 'Nhập tên dự án' })
  @MaxLength(160, { message: 'Tên dự án tối đa 160 ký tự' })
  projectName!: string;

  @IsIn(['du-an'], { message: 'Chuyên mục GPT chỉ hỗ trợ dự án' })
  category!: 'du-an';

  @IsOptional()
  @IsString()
  @MaxLength(80)
  site?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  locale?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  extraNotes?: string;
}
