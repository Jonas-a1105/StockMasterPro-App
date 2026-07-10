import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class UploadService {
  constructor(private readonly config: ConfigService) {}

  async uploadImage(file: Express.Multer.File): Promise<{ url: string }> {
    if (!file) throw new BadRequestException('No se envió ningún archivo');

    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Formato no permitido. Use JPEG, PNG, WebP o GIF',
      );
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('Archivo demasiado grande. Máximo 5MB');
    }

    const ext = file.mimetype.split('/')[1];
    const filename = `${crypto.randomBytes(16).toString('hex')}.${ext}`;

    const uploadDir = this.config.get('UPLOAD_DIR') || './uploads';
    const filepath = `${uploadDir}/${filename}`;

    const fs = require('fs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    fs.writeFileSync(filepath, file.buffer);

    const baseUrl = this.config.get('APP_URL') || 'http://localhost:3000';
    return { url: `${baseUrl}/uploads/${filename}` };
  }
}
