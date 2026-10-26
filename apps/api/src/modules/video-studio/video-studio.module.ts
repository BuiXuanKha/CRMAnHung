import { Module } from '@nestjs/common';
import { VideoStudioController } from './video-studio.controller';
import { VideoStudioService } from './video-studio.service';
import { VideoStudioNarrationService } from './video-studio-narration.service';
import { VideoStudioTtsService } from './video-studio-tts.service';
import { VideoStudioRenderService } from './video-studio-render.service';

@Module({
  controllers: [VideoStudioController],
  providers: [
    VideoStudioService,
    VideoStudioNarrationService,
    VideoStudioTtsService,
    VideoStudioRenderService,
  ],
})
export class VideoStudioModule {}
