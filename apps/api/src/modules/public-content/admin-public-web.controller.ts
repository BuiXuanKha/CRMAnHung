import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser, type RequestUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  SetPublicLotPublishedDto,
  UpdatePublicListingDraftDto,
} from './dto/public-listing.dto';
import { LotGptRequestDto } from './dto/lot-gpt.dto';
import { PostGptRequestDto } from './dto/post-gpt.dto';
import { CreatePublicPostDto, SetPublicPostStatusDto } from './dto/public-post.dto';
import { LotGptService } from './lot-gpt.service';
import { PostGptService } from './post-gpt.service';
import { PublicContentService } from './public-content.service';

@Controller('admin/public-web')
@UseGuards(RolesGuard)
@Roles('ADMIN')
export class AdminPublicWebController {
  constructor(
    private readonly publicContent: PublicContentService,
    private readonly lotGpt: LotGptService,
    private readonly postGpt: PostGptService,
  ) {}

  @Get('lots')
  @Roles('ADMIN', 'STAFF')
  listLots(@CurrentUser() user: RequestUser) {
    return this.publicContent.listAdminLots(user);
  }

  @Get('posts')
  listPosts() {
    return this.publicContent.listAdminPosts();
  }

  @Post('posts')
  createPost(@Body() dto: CreatePublicPostDto) {
    return this.publicContent.createPost(dto);
  }

  @Patch('posts/:id/status')
  setPostStatus(@Param('id') id: string, @Body() dto: SetPublicPostStatusDto) {
    return this.publicContent.setPostStatus(id, dto.status);
  }

  @Post('media')
  @Roles('ADMIN', 'STAFF')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadMedia(
    @UploadedFile()
    file?: { buffer: Buffer; mimetype: string; originalname?: string },
    @Body('title') title?: string,
    @Body('index') index?: string,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Thiếu file ảnh.');
    }
    const n = Number.parseInt(String(index ?? ''), 10);
    return this.publicContent.uploadPublicMedia(file, {
      title,
      index: Number.isFinite(n) && n > 0 ? n : 1,
    });
  }

  @Patch('lots/:id/draft')
  @Roles('STAFF')
  updateDraft(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdatePublicListingDraftDto,
  ) {
    return this.publicContent.updateDraft(user, id, dto);
  }

  @Patch('lots/:id/published')
  @Roles('STAFF')
  setPublished(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: SetPublicLotPublishedDto,
  ) {
    return this.publicContent.setPublished(user, id, dto.isPublished);
  }

  @Post('lots/gpt-content')
  @Roles('STAFF')
  generateLotGptContent(@Body() dto: LotGptRequestDto) {
    return this.lotGpt.generateContent(dto);
  }

  @Post('posts/gpt-content')
  generatePostGptContent(@Body() dto: PostGptRequestDto) {
    return this.postGpt.generateContent(dto);
  }
}
