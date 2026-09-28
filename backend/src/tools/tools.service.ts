import { Injectable } from '@nestjs/common';

@Injectable()
export class ToolsService {
  imageToBase64(file: Express.Multer.File) {
    const base64: string = file.buffer.toString('base64');

    return {
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      base64,
      // dataUrl: `data:${file.mimetype};base64,${base64}`,
    };
  }

  videoToBase64(file: Express.Multer.File) {
    const base64: string = file.buffer.toString('base64');

    return {
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      base64,
      // dataUrl: `data:${file.mimetype};base64,${base64}`,
    };
  }
}
