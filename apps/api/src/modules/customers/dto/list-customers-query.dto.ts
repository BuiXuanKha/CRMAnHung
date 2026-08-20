import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { CUSTOMER_STATUSES, type CustomerStatusValue } from '../customer-status';

function toOptionalBoolean(value: unknown): boolean | undefined {
  if (value === true || value === 'true' || value === '1') return true;
  if (value === false || value === 'false' || value === '0') return false;
  return undefined;
}

function toOptionalInt(value: unknown): number | undefined {
  if (value == null || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : undefined;
}

const BUDGET_FILTERS = ['none', 'has', 'lt_1b', '1b_2b', 'gt_2b'] as const;
const NEED_FILTERS = ['has', 'empty'] as const;

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

  @IsOptional()
  @IsIn(NEED_FILTERS)
  needFilter?: (typeof NEED_FILTERS)[number];

  @IsOptional()
  @Transform(({ value }) => toOptionalInt(value))
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;

  @IsOptional()
  @Transform(({ value }) => toOptionalInt(value))
  @IsInt()
  @Min(0)
  offset?: number;
}
