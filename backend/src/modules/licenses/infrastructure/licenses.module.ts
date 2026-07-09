import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { LicensesController } from './http/licenses.controller';
import { AdminTenantController } from './http/admin-tenant.controller';
import { LicensesService } from './licenses.service';
import { PostgresLicenseRepo } from './persistence/postgres-license.repository';
import { StripeService } from './stripe.service';

import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET');
        if (!secret)
          throw new Error('JWT_SECRET no definida en variables de entorno');
        return {
          secret,
          signOptions: { expiresIn: '24h' },
        };
      },
    }),
  ],
  controllers: [LicensesController, AdminTenantController],
  providers: [LicensesService, PostgresLicenseRepo, StripeService],
})
export class LicensesModule {}
