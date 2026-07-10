import { Module } from '@nestjs/common';
import { UploadController } from './http/upload.controller';
import { UploadService } from '../application/upload.service';

@Module({
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
