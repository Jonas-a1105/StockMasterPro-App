import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PostgresUserRepo } from './PostgresUserRepo';

@Module({
  controllers: [UsersController],
  providers: [UsersService, PostgresUserRepo],
  exports: [PostgresUserRepo],
})
export class UsersModule {}
