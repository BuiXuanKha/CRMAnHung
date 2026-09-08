import { IsIn, IsString, Matches, MaxLength, MinLength } from 'class-validator';

const TARGET_TYPES = ['CUSTOMER', 'LODAT', 'TRANSACTION', 'TITLE_SERVICE'] as const;

export class CreateWorkTaskDto {
  @IsString()
  @MinLength(1, { message: 'Nhập nội dung công việc.' })
  @MaxLength(2000)
  content!: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Chọn hạn làm việc.' })
  dueOn!: string;

  @IsIn(TARGET_TYPES, { message: 'Nguồn công việc không hợp lệ.' })
  targetType!: (typeof TARGET_TYPES)[number];

  @IsString()
  @MinLength(1)
  @MaxLength(60)
  targetId!: string;
}
