import { IsString, MaxLength, MinLength } from 'class-validator';

export class AcknowledgePhoneDuplicateDto {
  @IsString()
  @MinLength(1, { message: 'Tên khách không được để trống.' })
  @MaxLength(120)
  fullName!: string;
}
