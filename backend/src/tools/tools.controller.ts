import {
  Body,
  Controller,
  FileTypeValidator,
  HttpCode,
  HttpStatus,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Base64ToFileDto } from './dto/base64-to-file.dto';
import { ToolsService } from './tools.service';

const MB = 1024 * 1024;
const IMAGE_MAX_SIZE = 10 * MB;
const VIDEO_MAX_SIZE = 50 * MB;

const imageFilePipe = new ParseFilePipe({
  validators: [
    new MaxFileSizeValidator({ maxSize: IMAGE_MAX_SIZE }),
    new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp|gif|heic)$/ }),
  ],
});

const videoFilePipe = new ParseFilePipe({
  validators: [
    new MaxFileSizeValidator({ maxSize: VIDEO_MAX_SIZE }),
    new FileTypeValidator({
      fileType: /^video\/(mp4|webm|ogg|quicktime|x-msvideo|x-matroska)$/,
    }),
  ],
});

@Controller('tools')
@UseGuards(JwtAuthGuard)
export class ToolsController {
  constructor(private readonly toolsService: ToolsService) {}

  // ===================== FILE -> BASE64 =====================

  /** POST /tools/image-to-base64  (form-data, field: image) */
  @Post('image-to-base64')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('image', { limits: { fileSize: IMAGE_MAX_SIZE } }),
  )
  imageToBase64(@UploadedFile(imageFilePipe) file: Express.Multer.File) {
    return this.toolsService.imageToBase64(file);
  }

  /** POST /tools/video-to-base64  (form-data, field: video) */
  @Post('video-to-base64')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('video', { limits: { fileSize: VIDEO_MAX_SIZE } }),
  )
  videoToBase64(@UploadedFile(videoFilePipe) file: Express.Multer.File) {
    return this.toolsService.videoToBase64(file);
  }

  // ===================== BASE64 -> FILE =====================

  /** POST /tools/base64-to-image  (JSON: { base64, fileName? }) -> tải file ảnh */
  @Post('base64-to-image')
  @HttpCode(HttpStatus.OK)
  base64ToImage(@Body() dto: Base64ToFileDto) {
    const result = this.toolsService.base64ToImage(dto.base64, dto.fileName);
    return this.toStreamableFile(result);
  }

  /** POST /tools/base64-to-video  (JSON: { base64, fileName? }) -> tải file video */
  @Post('base64-to-video')
  @HttpCode(HttpStatus.OK)
  base64ToVideo(@Body() dto: Base64ToFileDto) {
    const result = this.toolsService.base64ToVideo(dto.base64, dto.fileName);
    return this.toStreamableFile(result);
  }

  // ===================== HELPER =====================

  /** Trả file nhị phân về client, trình duyệt sẽ tự tải xuống */
  private toStreamableFile(file: {
    buffer: Buffer;
    mimeType: string;
    fileName: string;
    size: number;
  }): StreamableFile {
    return new StreamableFile(file.buffer, {
      type: file.mimeType,
      length: file.size,
      // filename* hỗ trợ tên có dấu tiếng Việt
      disposition: `attachment; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
    });
  }
}
