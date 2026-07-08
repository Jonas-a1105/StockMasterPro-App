import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './http/auth.controller';
import { AuthService } from './auth.service';
import { PostgresAuthRepo } from './persistence/PostgresAuthRepo';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET!, // validated at bootstrap
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    {
      provide: 'AuthRepository',
      useClass: PostgresAuthRepo,
    },
  ],
  exports: [JwtStrategy, PassportModule],
})
export class AuthModule {}
