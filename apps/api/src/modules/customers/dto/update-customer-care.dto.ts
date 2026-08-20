import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { CUSTOMER_STATUSES, type CustomerStatusValue } from '../customer-status';

export class UpdateCustomerCareDto {
  @IsIn(CUSTOMER_STATUSES)
  status!: CustomerStatusValue;

  @ValidateIf((_, value) => value !== null)
  @IsInt()
  @Min(0)
  budgetMinVnd!: number | null;

  @ValidateIf((_, value) => value !== null)
  @IsInt()
  @Min(0)
  budgetMaxVnd!: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  needSummary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
