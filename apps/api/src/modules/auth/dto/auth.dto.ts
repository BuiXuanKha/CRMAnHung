import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  username!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(18)
  password!: string;
}

export class RefreshTokenDto {
  /** Optional when browser sends HttpOnly refresh cookie (BUG-007). */
  @IsOptional()
  @IsString()
  @MinLength(1)
  refreshToken?: string;
}
