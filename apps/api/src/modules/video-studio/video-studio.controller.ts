import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  CurrentUser,
  type RequestUser,
} from '../../common/decorators/current-user.decorator';
import {
  AddVideoSceneDto,
  ReorderVideoScenesDto,
  UpdateVideoSceneDto,
} from './dto/video-studio.dto';
import {
  VIDEO_RAW_MAX_BYTES,
  VideoStudioService,
} from './video-studio.service';

@Controller('video-projects')
export class VideoStudioController {
  constructor(private readonly videoStudio: VideoStudioService) {}

  @Get('lodat/:lodatId')
  getOrCreateForLodat(
    @CurrentUser() user: RequestUser,
    @Param('lodatId') lodatId: string,
  ) {
    return this.videoStudio.getOrCreateForLodat(user, lodatId);
  }

  @Get(':projectId')
  getProject(
    @CurrentUser() user: RequestUser,
    @Param('projectId') projectId: string,
  ) {
    return this.videoStudio.getProject(user, projectId);
  }

  @Patch(':projectId/scenes/:sceneId')
  updateScene(
    @CurrentUser() user: RequestUser,
    @Param('projectId') projectId: string,
    @Param('sceneId') sceneId: string,
    @Body() dto: UpdateVideoSceneDto,
  ) {
    return this.videoStudio.updateScene(user, projectId, sceneId, dto);
  }

  @Post(':projectId/scenes')
  addScene(
    @CurrentUser() user: RequestUser,
    @Param('projectId') projectId: string,
    @Body() dto: AddVideoSceneDto,
  ) {
    return this.videoStudio.addScene(user, projectId, dto);
  }

  @Post(':projectId/scenes/reorder')
  reorderScenes(
    @CurrentUser() user: RequestUser,
    @Param('projectId') projectId: string,
    @Body() dto: ReorderVideoScenesDto,
  ) {
    return this.videoStudio.reorderScenes(user, projectId, dto);
  }

  @Post(':projectId/scenes/:sceneId/raw-video')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: VIDEO_RAW_MAX_BYTES } }),
  )
  uploadRawVideo(
    @CurrentUser() user: RequestUser,
    @Param('projectId') projectId: string,
    @Param('sceneId') sceneId: string,
    @UploadedFile()
    file?: { buffer: Buffer; mimetype: string; originalname?: string; size?: number },
  ) {
    if (!file) {
      throw new BadRequestException('Thiếu file video.');
    }
    return this.videoStudio.uploadRawVideo(user, projectId, sceneId, file);
  }

  @Post(':projectId/scenes/:sceneId/generate-narration')
  generateNarration(
    @CurrentUser() user: RequestUser,
    @Param('projectId') projectId: string,
    @Param('sceneId') sceneId: string,
  ) {
    return this.videoStudio.generateNarration(user, projectId, sceneId);
  }

  @Post(':projectId/export')
  exportProject(
    @CurrentUser() user: RequestUser,
    @Param('projectId') projectId: string,
  ) {
    return this.videoStudio.exportProject(user, projectId);
  }
}
