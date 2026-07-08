import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { LicensesController } from './licenses.controller';
import { AdminTenantController } from './infrastructure/admin-tenant.controller';
import { LicensesService } from './licenses.service';
import { PostgresLicenseRepo } from './infrastructure/PostgresLicenseRepo';
import { StripeService } from './infrastructure/stripe.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'stockmaster-pro-secret-key-2026',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [LicensesController, AdminTenantController],
  providers: [LicensesService, PostgresLicenseRepo, StripeService],
})
export class LicensesModule {}
