import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

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
