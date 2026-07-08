import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { RLSInterceptor } from '@shared/infrastructure/http/interceptors/rls.interceptor';
import { PrismaModule } from '@shared/infrastructure/prisma/prisma.module';
import { AuthModule } from './modules/auth';
import { InventoryModule } from './modules/inventory';
import { SalesModule } from './modules/sales';
import { SuppliersModule } from './modules/suppliers';
import { PurchaseOrdersModule } from './modules/purchase-orders';
import { LicensesModule } from './modules/licenses';
import { UsersModule } from './modules/users';
import { CustomersModule } from './modules/customers';
import { AccountsPayableModule } from './modules/accounts-payable';
import { ExpenseModule } from './modules/expenses';
import { CreditNoteModule } from './modules/credit-notes';
import { ReportModule } from './modules/reports';
import { ExchangeRateModule } from './modules/exchange-rate';
import { WarehouseModule } from './modules/warehouses';
import { CategoryModule } from './modules/categories';
import { WebhooksModule } from './modules/webhooks';
import { EventModule } from './modules/events';
import { NotificationsModule } from './modules/notifications';
import { SocialModule } from './modules/social';
import { AccountsReceivableModule } from './modules/accounts-receivable';
import { CashRegisterModule } from './modules/cash-register';


import { JwtAuthGuard } from '@shared/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '@shared/infrastructure/guards/roles.guard';
import { TenantLicenseGuard } from '@shared/infrastructure/guards/tenant-license.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    InventoryModule,
    SalesModule,
    SuppliersModule,
    PurchaseOrdersModule,
    LicensesModule,
    UsersModule,
    CustomersModule,
    AccountsPayableModule,
    ExpenseModule,
    CreditNoteModule,
    ReportModule,
    ExchangeRateModule,
    WarehouseModule,
    CategoryModule,
    WebhooksModule,
    EventModule,
    NotificationsModule,
    SocialModule,
    AccountsReceivableModule,
    CashRegisterModule,
  ],
  providers: [
    // Order matters: Throttle → Auth → Roles → License
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: TenantLicenseGuard },
    { provide: APP_INTERCEPTOR, useClass: RLSInterceptor },
  ],
})
export class AppModule {}
