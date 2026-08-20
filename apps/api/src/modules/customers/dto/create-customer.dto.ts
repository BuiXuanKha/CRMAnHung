import { Transform } from 'class-transformer';
import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @MinLength(1, { message: 'Vui lòng nhập tên khách' })
  @MaxLength(120)
  fullName!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.replace(/\D/g, '') : value,
  )
  @IsString()
  @Matches(/^0\d{9}$/, { message: 'SĐT phải gồm 10 số, bắt đầu bằng 0' })
  phone!: string;

  @IsString()
  @MinLength(1, { message: 'Vui lòng chọn hotline khách đã liên hệ.' })
  sourceHotlineId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
