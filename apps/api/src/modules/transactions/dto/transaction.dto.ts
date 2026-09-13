import { Transform, Type } from 'class-transformer';
import {
  Allow,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

function toOptionalInt(value: unknown): number | undefined {
  if (value == null || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : undefined;
}

export class ListTransactionsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  keyword?: string;

  @IsOptional()
  @IsIn(['OWN', 'RECORD'])
  type?: 'OWN' | 'RECORD';

  @IsOptional()
  @IsIn(['DA_COC', 'DA_CONG_CHUNG', 'HOAN_TAT', 'HUY'])
  status?: 'DA_COC' | 'DA_CONG_CHUNG' | 'HOAN_TAT' | 'HUY';

  @IsOptional()
  @IsString()
  @MaxLength(60)
  createdByEmployeeId?: string;

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

export class TransactionPartyInputDto {
  @IsString({ message: 'Người bán và người mua phải là khách trong CRM.' })
  @MinLength(1, { message: 'Người bán và người mua phải là khách trong CRM.' })
  @MaxLength(60)
  customerId!: string;

  @IsString()
  @MinLength(1, { message: 'Cần tên bên giao dịch.' })
  @MaxLength(200)
  freeTextName!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class CreateTransactionDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  lodatId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  lodatCustomerMapId?: string;

  @IsIn(['OWN', 'RECORD'], { message: 'Loại giao dịch không hợp lệ.' })
  type!: 'OWN' | 'RECORD';

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  notaryAppointmentAt?: string | null;

  @Allow()
  salePriceVnd!: number | string;

  @IsOptional()
  @Allow()
  taxPriceVnd?: number | string | null;

  @IsOptional()
  @Allow()
  commissionVnd?: number | string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  @MaxLength(4000)
  note?: string | null;

  @IsArray()
  @ArrayMinSize(1, { message: 'Cần ít nhất một người bán.' })
  @ValidateNested({ each: true })
  @Type(() => TransactionPartyInputDto)
  sellers!: TransactionPartyInputDto[];

  @IsArray()
  @ArrayMinSize(1, { message: 'Cần ít nhất một người mua.' })
  @ValidateNested({ each: true })
  @Type(() => TransactionPartyInputDto)
  buyers!: TransactionPartyInputDto[];
}

export class UpdateTransactionDto {
  @IsOptional()
  @IsIn(['DA_COC', 'DA_CONG_CHUNG', 'HOAN_TAT', 'HUY'])
  status?: 'DA_COC' | 'DA_CONG_CHUNG' | 'HOAN_TAT' | 'HUY';

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  @MaxLength(2000)
  cancelReason?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  notaryAppointmentAt?: string | null;

  @IsOptional()
  @Allow()
  salePriceVnd?: number | string;

  @IsOptional()
  @Allow()
  taxPriceVnd?: number | string | null;

  @IsOptional()
  @Allow()
  commissionVnd?: number | string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  @MaxLength(4000)
  note?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TransactionPartyInputDto)
  sellers?: TransactionPartyInputDto[];

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TransactionPartyInputDto)
  buyers?: TransactionPartyInputDto[];
}
