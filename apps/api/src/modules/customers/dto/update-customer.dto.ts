import { IsBoolean, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { CUSTOMER_STATUSES, type CustomerStatusValue } from '../customer-status';

export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  fullName?: string;

  @IsOptional()
  @IsIn(CUSTOMER_STATUSES)
  status?: CustomerStatusValue;

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @IsOptional()
  @IsBoolean()
  isHidden?: boolean;
}
