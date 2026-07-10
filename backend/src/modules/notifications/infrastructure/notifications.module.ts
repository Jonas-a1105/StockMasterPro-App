import { Module } from '@nestjs/common';
import { NotificationsController } from './http/notifications.controller';
import { NotificationsService } from '../application/notifications.service';
import { NotificationGeneratorService } from '../application/notification-generator.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationGeneratorService],
})
export class NotificationsModule {}
