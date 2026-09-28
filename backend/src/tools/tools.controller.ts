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
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('tools')
export class ToolsController {
  constructor(private toolsServices: ToolsService) {}

  @Post('image-to-base64')
  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(JwtAuthGuard)
  imageToBase64(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 10 * 1024 * 1024, // 10MB
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
  convertVideo() {
    return 'hello';
  }
}
