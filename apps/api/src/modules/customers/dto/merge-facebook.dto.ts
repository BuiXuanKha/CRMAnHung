import { digitsFromPhoneRaw } from '@crmanhung/shared';
import { Transform } from 'class-transformer';
import { IsString, Matches, MinLength } from 'class-validator';

export class MergeFacebookDto {
  @IsString()
  @MinLength(1)
  sourceCustomerId!: string;

  @IsString()
  @MinLength(1)
  targetCustomerId!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? digitsFromPhoneRaw(value) : value,
  )
  @IsString()
  @Matches(/^0\d{9}$/, { message: 'SĐT phải gồm 10 số, bắt đầu bằng 0' })
  phone!: string;
}
