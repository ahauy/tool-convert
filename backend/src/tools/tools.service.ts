import { BadRequestException, Injectable } from '@nestjs/common';

type MediaKind = 'image' | 'video';

const KIND_LABEL: Record<MediaKind, string> = {
  image: 'ảnh',
  video: 'video',
};

const MIME_TO_EXT: Record<string, string> = {
  // Images
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/bmp': 'bmp',
  'image/tiff': 'tiff',
  'image/x-icon': 'ico',
  // Videos
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
  'video/x-msvideo': 'avi',
  'video/x-matroska': 'mkv',
  'video/mpeg': 'mpeg',
};

@Injectable()
export class ToolsService {
  // ===================== FILE -> BASE64 =====================

  imageToBase64(file: Express.Multer.File) {
    return this.fileToBase64(file, 'image');
  }

  videoToBase64(file: Express.Multer.File) {
    return this.fileToBase64(file, 'video');
  }

  private fileToBase64(file: Express.Multer.File, kind: MediaKind) {
    if (!file) {
      throw new BadRequestException('File là bắt buộc!');
    }
    if (!file.buffer?.length) {
      throw new BadRequestException('File rỗng!');
    }
    if (!file.mimetype?.startsWith(`${kind}/`)) {
      throw new BadRequestException(`File phải là ${KIND_LABEL[kind]}!`);
    }

    return {
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      base64: file.buffer.toString('base64'),
    };
  }

  // ===================== BASE64 -> FILE =====================

  base64ToImage(base64String: string, fileName?: string) {
    return this.base64ToFile(base64String, 'image', fileName);
  }

  base64ToVideo(base64String: string, fileName?: string) {
    return this.base64ToFile(base64String, 'video', fileName);
  }

  private base64ToFile(
    base64String: string,
    kind: MediaKind,
    fileName?: string,
  ) {
    const { mimeType, buffer } = this.parseBase64(base64String);

    if (!mimeType.startsWith(`${kind}/`)) {
      throw new BadRequestException(
        `Dữ liệu Base64 không phải là ${KIND_LABEL[kind]}!`,
      );
    }

    return {
      buffer,
      mimeType,
      fileName: this.generateFileName(mimeType, fileName),
      size: buffer.length,
    };
  }

  /** Data URL ("data:image/png;base64,....") -> { mimeType, buffer } */
  private parseBase64(dataUrl: string) {
    if (!dataUrl || typeof dataUrl !== 'string') {
      throw new BadRequestException('Cần có chuỗi Base64!');
    }

    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/s);
    if (!match) {
      throw new BadRequestException(
        'Chuỗi Base64 phải là data URL hợp lệ, ví dụ: data:image/png;base64,...',
      );
    }

    const [, mimeType, rawData] = match;
    const base64Data = rawData.replace(/\s/g, '');

    if (!this.isValidBase64(base64Data)) {
      throw new BadRequestException('Chuỗi Base64 không hợp lệ!');
    }

    return { mimeType, buffer: Buffer.from(base64Data, 'base64') };
  }

  private isValidBase64(value: string): boolean {
    return value.length % 4 === 0 && /^[A-Za-z0-9+/]*={0,2}$/.test(value);
  }

  // ===================== HELPERS =====================

  private generateFileName(mimeType: string, customName?: string): string {
    if (customName) {
      return this.sanitizeFileName(customName);
    }
    const ext = MIME_TO_EXT[mimeType] ?? 'bin';
    return `file_${Date.now()}.${ext}`;
  }

  private sanitizeFileName(name: string): string {
    return (
      name
        // eslint-disable-next-line no-control-regex
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
        .replace(/\.\./g, '_')
        .trim()
    );
  }
}
