import { IsBoolean, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { CustomerStatus } from '@crmanhung/shared';

export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  fullName?: string;

  @IsOptional()
  @IsEnum(CustomerStatus)
  status?: CustomerStatus;

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @IsOptional()
  @IsBoolean()
  isHidden?: boolean;
}
