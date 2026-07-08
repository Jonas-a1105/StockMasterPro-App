import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { LicensesController } from './http/licenses.controller';
import { AdminTenantController } from './http/admin-tenant.controller';
import { LicensesService } from './licenses.service';
import { PostgresLicenseRepo } from './persistence/PostgresLicenseRepo';
import { StripeService } from './stripe.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET!, // validated at bootstrap
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [LicensesController, AdminTenantController],
  providers: [LicensesService, PostgresLicenseRepo, StripeService],
})
export class LicensesModule {}
