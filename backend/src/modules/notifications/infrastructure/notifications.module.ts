import { Module } from '@nestjs/common';
import { NotificationsController } from './http/notifications.controller';
import { NotificationsService } from '../application/notifications.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService],
})
export class NotificationsModule {}
