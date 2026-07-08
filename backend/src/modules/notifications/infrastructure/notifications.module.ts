import { Module } from '@nestjs/common';
import { NotificationsController } from './http/notifications.controller';

@Module({
  controllers: [NotificationsController],
})
export class NotificationsModule {}
