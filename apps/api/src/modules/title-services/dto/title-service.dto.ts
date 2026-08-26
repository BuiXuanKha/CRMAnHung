import { Transform } from 'class-transformer';
import {
  Allow,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

const TITLE_STATUSES = ['DANG_LAM', 'TAM_DUNG', 'HOAN_THANH', 'HUY'] as const;

export class ListTitleServicesQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  keyword?: string;

  @IsOptional()
  @IsIn(TITLE_STATUSES)
  status?: (typeof TITLE_STATUSES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(60)
  createdByEmployeeId?: string;
}

export class CreateTitleServiceDto {
  @IsString()
  @MinLength(1, { message: 'Chọn khách hàng.' })
  @MaxLength(60)
  customerId!: string;

  @IsOptional()
  @Allow()
  agreedFeeVnd?: number | string | null;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  needSummary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  note?: string;

  @IsOptional()
  @IsString()
  startedAt?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  expectedDoneAt?: string | null;
}

export class UpdateTitleServiceDto {
  @IsOptional()
  @IsIn(TITLE_STATUSES, { message: 'Trạng thái không hợp lệ.' })
  status?: (typeof TITLE_STATUSES)[number];

  @IsOptional()
  @Allow()
  agreedFeeVnd?: number | string | null;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  needSummary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  note?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  expectedDoneAt?: string | null;
}

export class PinTitleServiceDto {
  @Transform(({ value }) => {
    if (value === true || value === 'true' || value === '1') return true;
    if (value === false || value === 'false' || value === '0') return false;
    return value;
  })
  @IsBoolean({ message: 'Cần chọn ghim hoặc bỏ ghim.' })
  pinned!: boolean;
}

const TITLE_STEPS = [
  'BAN_GIA',
  'THU_THAP_GIAY_TO',
  'DO_DAC',
  'NOP_HO_SO',
  'BO_SUNG',
  'LAM_VIEC_CO_QUAN',
  'NHAN_KET_QUA',
  'BAN_GIAO',
  'KHAC',
] as const;

const TITLE_MONEY_KINDS = ['THU', 'CHI'] as const;

export class AddTitleServiceProgressDto {
  @IsIn(TITLE_STEPS, { message: 'Loại bước không hợp lệ.' })
  stepType!: (typeof TITLE_STEPS)[number];

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  note?: string;

  @IsOptional()
  @IsString()
  happenedAt?: string;
}

export class AddTitleServiceMoneyDto {
  @IsIn(TITLE_MONEY_KINDS, { message: 'Loại khoản tiền không hợp lệ.' })
  kind!: (typeof TITLE_MONEY_KINDS)[number];

  @IsString()
  @MinLength(1, { message: 'Nhập tiêu đề khoản tiền.' })
  @MaxLength(200)
  title!: string;

  @Allow()
  amountVnd!: number | string;

  @IsOptional()
  @IsString()
  happenedAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  note?: string;
}
