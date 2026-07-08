import { Module } from '@nestjs/common';
import { EventController } from './event.controller';
import { PostgresEventRepo } from './PostgresEventRepo';

@Module({
  controllers: [EventController],
  providers: [PostgresEventRepo],
  exports: [PostgresEventRepo],
})
export class EventModule {}
