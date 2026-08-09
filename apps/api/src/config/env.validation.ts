import { plainToInstance } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

class EnvironmentVariables {
  @IsOptional()
  @IsInt()
  @Min(1)
  PORT?: number;

  @IsOptional()
  @IsString()
  HOST?: string;

  @IsIn(['development', 'production', 'test'])
  NODE_ENV!: string;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsString()
  @MinLength(32)
  JWT_ACCESS_SECRET!: string;

  @IsString()
  @MinLength(32)
  JWT_REFRESH_SECRET!: string;

  @IsOptional()
  @IsString()
  JWT_ACCESS_EXPIRES_IN?: string;

  @IsOptional()
  @IsString()
  JWT_REFRESH_EXPIRES_IN?: string;

  @IsOptional()
  @IsString()
  CORS_ORIGINS?: string;

  /** Cloudflare R2 — required in production; optional in development until upload features run */
  @IsOptional()
  @IsString()
  R2_ACCOUNT_ID?: string;

  @IsOptional()
  @IsString()
  R2_ACCESS_KEY_ID?: string;

  @IsOptional()
  @IsString()
  R2_SECRET_ACCESS_KEY?: string;

  @IsOptional()
  @IsString()
  R2_BUCKET?: string;

  @IsOptional()
  @IsString()
  R2_ENDPOINT?: string;

  @IsOptional()
  @IsString()
  R2_PUBLIC_BASE_URL?: string;

  /** Bucket riêng cho tài liệu mật — không gắn CDN public */
  @IsOptional()
  @IsString()
  R2_PRIVATE_BUCKET?: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(`Invalid environment: ${errors.toString()}`);
  }

  if (validated.NODE_ENV === 'production') {
    const requiredR2 = [
      'R2_ACCOUNT_ID',
      'R2_ACCESS_KEY_ID',
      'R2_SECRET_ACCESS_KEY',
      'R2_BUCKET',
      'R2_ENDPOINT',
      'R2_PUBLIC_BASE_URL',
      'R2_PRIVATE_BUCKET',
    ] as const;
    const missing = requiredR2.filter((key) => !validated[key]);
    if (missing.length) {
      throw new Error(
        `Invalid environment: production requires R2 vars: ${missing.join(', ')}`,
      );
    }
  }

  if (
    validated.DATABASE_URL.startsWith('file:') ||
    !validated.DATABASE_URL.startsWith('postgresql')
  ) {
    throw new Error(
      'Invalid environment: DATABASE_URL must be a postgresql:// connection string (ADR 0004)',
    );
  }

  return validated;
}
