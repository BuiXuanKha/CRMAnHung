import { Transform } from 'class-transformer';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateHotlineDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.replace(/\D/g, '') : value,
  )
  @IsString()
  @Matches(/^0\d{9}$/, { message: 'SĐT phải gồm 10 số, bắt đầu bằng 0' })
  phone!: string;

  @IsString()
  @MinLength(1, { message: 'Vui lòng nhập tên hiển thị.' })
  @MaxLength(80)
  label!: string;
}
