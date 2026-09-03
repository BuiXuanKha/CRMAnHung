import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class PublicImageQueryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  url!: string;
}
