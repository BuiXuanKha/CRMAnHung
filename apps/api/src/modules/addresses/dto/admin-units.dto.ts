import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateAdminUnitDto {
  @IsString()
  @MinLength(1, { message: 'Nhập tên.' })
  @MaxLength(120, { message: 'Tên tối đa 120 ký tự.' })
  name!: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}

export class ListAdminUnitsQueryDto {
  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsIn(['0', '1', 'true', 'false'])
  includeHidden?: string;
}
