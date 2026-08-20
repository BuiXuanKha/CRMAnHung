import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
import { CUSTOMER_STATUSES, type CustomerStatusValue } from '../customer-status';

function toOptionalBoolean(value: unknown): boolean | undefined {
  if (value === true || value === 'true' || value === '1') return true;
  if (value === false || value === 'false' || value === '0') return false;
  return undefined;
}

const BUDGET_FILTERS = ['none', 'has', 'lt_1b', '1b_2b', 'gt_2b'] as const;

export class ListCustomersQueryDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsIn(CUSTOMER_STATUSES)
  status?: CustomerStatusValue;

  @IsOptional()
  @Transform(({ value }) => toOptionalBoolean(value))
  @IsBoolean()
  includeHidden?: boolean;

  @IsOptional()
  @Transform(({ value }) => toOptionalBoolean(value))
  @IsBoolean()
  hiddenOnly?: boolean;

  @IsOptional()
  @IsIn(BUDGET_FILTERS)
  budgetFilter?: (typeof BUDGET_FILTERS)[number];

  @IsOptional()
  @IsString()
  contactChannel?: string;
}
