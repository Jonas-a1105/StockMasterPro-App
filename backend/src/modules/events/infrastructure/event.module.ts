import { Module } from '@nestjs/common';
import { EventController } from './http/event.controller';
import { PostgresEventRepo } from './persistence/postgres-event.repository';

@Module({
  controllers: [EventController],
  providers: [PostgresEventRepo],
  exports: [PostgresEventRepo],
})
export class EventModule {}
