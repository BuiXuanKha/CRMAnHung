import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import type { VideoSceneKind, VideoSceneStatus } from '@crmanhung/shared';

const SCENE_KINDS = [
  'PROPERTY_HERO',
  'PROPERTY_DETAIL',
  'LOCATION_CONTEXT',
  'VALUE_PROPOSITION',
  'CALL_TO_ACTION',
  'POI_UTILITY',
  'POI_SCHOOL',
  'POI_MARKET',
  'POI_HOSPITAL',
  'POI_TRANSPORT',
  'POI_CUSTOM',
] as const satisfies readonly VideoSceneKind[];

const SCENE_STATUSES = ['draft', 'approved'] as const satisfies readonly VideoSceneStatus[];

export class UpdateVideoSceneDto {
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  narrationText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  customLabel?: string;

  @IsOptional()
  @IsIn(SCENE_STATUSES)
  status?: VideoSceneStatus;
}

export class AddVideoSceneDto {
  @IsIn(SCENE_KINDS)
  kind!: VideoSceneKind;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  customLabel?: string;
}

export class ReorderVideoScenesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(12)
  @IsString({ each: true })
  sceneIds!: string[];
}
