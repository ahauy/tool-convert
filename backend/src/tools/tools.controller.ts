import {
  Controller,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ToolsService } from './tools.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('tools')
export class ToolsController {
  constructor(private toolsServices: ToolsService) {}

  @Post('image-to-base64')
  // @UseInterceptors(FileInterceptor('file'))
  @UseInterceptors(
    FileInterceptor('image', {
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  @UseGuards(JwtAuthGuard)
  imageToBase64(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 10 * 1024 * 1024,
          }),

          new FileTypeValidator({
            fileType: /^image\/(jpeg|png|webp|gif|heic)$/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.toolsServices.imageToBase64(file);
  }

  @Post('video-to-base64')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('video', {
      limits: {
        fileSize: 50 * 1024 * 1024,
      },
    }),
  )
  videoToBase64(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 }),
          new FileTypeValidator({
            fileType: /^video\/(mp4|webm|ogg|quicktime|x-msvideo|x-matroska)$/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.toolsServices.videoToBase64(file);
  }
}
