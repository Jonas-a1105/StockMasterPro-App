import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './http/auth.controller';
import { AuthService } from './auth.service';
import { PostgresAuthRepo } from './persistence/postgres-auth.repository';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshTokenCleanupService } from './refresh-token-cleanup.service';

import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET');
        if (!secret) throw new Error('JWT_SECRET no definida en variables de entorno');
        return {
          secret,
          signOptions: { expiresIn: '15m' },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    RefreshTokenCleanupService,
    {
      provide: 'AuthRepository',
      useClass: PostgresAuthRepo,
    },
  ],
  exports: [JwtStrategy, PassportModule],
})
export class AuthModule {}
