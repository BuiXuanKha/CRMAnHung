import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RecordPublicPageViewDto {
  @IsOptional()
  @IsString()
  @MaxLength(12)
  shareCode?: string;
}
