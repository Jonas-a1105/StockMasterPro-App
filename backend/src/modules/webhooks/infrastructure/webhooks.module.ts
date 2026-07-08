import { Module } from '@nestjs/common';
import { WebhooksController } from './http/webhooks.controller';
import { PrismaModule } from '@shared/infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
