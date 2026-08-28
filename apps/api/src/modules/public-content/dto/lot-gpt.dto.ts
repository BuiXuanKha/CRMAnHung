import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class LotGptLocationDto {
  @IsString()
  @MaxLength(200)
  village!: string;

  @IsString()
  @MaxLength(120)
  commune!: string;

  @IsString()
  @MaxLength(120)
  district!: string;

  @IsString()
  @MaxLength(120)
  province!: string;
}

export class LotGptRequestDto {
  @IsString()
  @MinLength(1, { message: 'Thiếu tiêu đề' })
  @MaxLength(200)
  title!: string;

  @ValidateNested()
  @Type(() => LotGptLocationDto)
  location!: LotGptLocationDto;

  @ValidateIf((_, v) => v != null)
  @IsOptional()
  @IsNumber()
  area?: number | null;

  @ValidateIf((_, v) => v != null)
  @IsOptional()
  @IsNumber()
  residentialArea?: number | null;

  @ValidateIf((_, v) => v != null)
  @IsOptional()
  @IsNumber()
  frontage?: number | null;

  @ValidateIf((_, v) => v != null)
  @IsOptional()
  @IsString()
  @MaxLength(40)
  direction?: string | null;

  @ValidateIf((_, v) => v != null)
  @IsOptional()
  @IsNumber()
  price?: number | null;

  @ValidateIf((_, v) => v != null)
  @IsOptional()
  @IsString()
  @MaxLength(200)
  priceText?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  kind?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  excerpt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  extraDescription?: string;
}
