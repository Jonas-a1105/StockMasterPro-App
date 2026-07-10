import { Injectable, BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

@Injectable()
export class UploadService {
  private readonly uploadDir = join(process.cwd(), 'public', 'uploads');

  constructor() {
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  getStorage() {
    return diskStorage({
      destination: this.uploadDir,
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
      },
    });
  }

  getFileFilter() {
    return (req: any, file: Express.Multer.File, cb: Function) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|webp|gif)$/)) {
        return cb(
          new BadRequestException('Solo imágenes (jpg, png, webp, gif)'),
          false,
        );
      }
      cb(null, true);
    };
  }

  getUploadUrl(filename: string): string {
    return `/uploads/${filename}`;
  }
}
