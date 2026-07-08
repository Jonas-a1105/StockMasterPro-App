import { Module } from '@nestjs/common';
import { UsersController } from './http/users.controller';
import { UsersService } from './users.service';
import { PostgresUserRepo } from './persistence/postgres-user.repository';

@Module({
  controllers: [UsersController],
  providers: [UsersService, PostgresUserRepo],
  exports: [PostgresUserRepo],
})
export class UsersModule {}
