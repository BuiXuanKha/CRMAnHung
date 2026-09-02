import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const USERNAME_PATTERN = /^[a-zA-Z0-9._-]+$/;
const PHONE_PATTERN = /^0\d{9}$/;

export class CreateUserDto {
  @IsString()
  @MinLength(2, { message: 'Tên đăng nhập tối thiểu 2 ký tự' })
  @MaxLength(40)
  @Matches(USERNAME_PATTERN, {
    message: 'Chỉ dùng chữ, số, dấu chấm, gạch ngang, gạch dưới',
  })
  username!: string;

  @IsString()
  @MinLength(1, { message: 'Vui lòng nhập họ tên' })
  @MaxLength(120)
  fullName!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.replace(/\D/g, '') : value,
  )
  @IsString()
  @Matches(PHONE_PATTERN, { message: 'SĐT phải gồm 10 số, bắt đầu bằng 0' })
  phone!: string;

  @IsString()
  @MinLength(6, { message: 'Mật khẩu tối thiểu 6 ký tự' })
  @MaxLength(128)
  password!: string;

  @IsOptional()
  @IsIn(['STAFF', 'ADMIN'], { message: 'Vai trò không hợp lệ' })
  role?: 'STAFF' | 'ADMIN';

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Tên đăng nhập tối thiểu 2 ký tự' })
  @MaxLength(40)
  @Matches(USERNAME_PATTERN, {
    message: 'Chỉ dùng chữ, số, dấu chấm, gạch ngang, gạch dưới',
  })
  username?: string;

  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Vui lòng nhập họ tên' })
  @MaxLength(120)
  fullName?: string;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.replace(/\D/g, '') : value,
  )
  @IsString()
  @Matches(PHONE_PATTERN, { message: 'SĐT phải gồm 10 số, bắt đầu bằng 0' })
  phone?: string;

  @IsOptional()
  @IsIn(['STAFF', 'ADMIN'], { message: 'Vai trò không hợp lệ' })
  role?: 'STAFF' | 'ADMIN';

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ResetUserPasswordDto {
  @IsString()
  @MinLength(6, { message: 'Mật khẩu tối thiểu 6 ký tự' })
  @MaxLength(128)
  password!: string;
}
