import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/infrastructure/auth.module';
import { InventoryModule } from './modules/inventory/infrastructure/inventory.module';
import { SalesModule } from './modules/sales/infrastructure/sales.module';
import { SuppliersModule } from './modules/suppliers/infrastructure/supplier.module';
import { PurchaseOrdersModule } from './modules/purchase-orders/infrastructure/purchase-order.module';
import { LicensesModule } from './modules/licenses/licenses.module';
import { UsersModule } from './modules/users/infrastructure/users.module';
import { CustomersModule } from './modules/customers/infrastructure/customers.module';
import { AccountsPayableModule } from './modules/accounts-payable/infrastructure/accounts-payable.module';
import { ExpenseModule } from './modules/expenses/infrastructure/expense.module';
import { CreditNoteModule } from './modules/credit-notes/infrastructure/credit-note.module';
import { ReportModule } from './modules/reports/infrastructure/report.module';
import { ExchangeRateModule } from './modules/exchange-rate/infrastructure/exchange-rate.module';
import { WarehouseModule } from './modules/warehouses/infrastructure/warehouse.module';
import { CategoryModule } from './modules/categories/infrastructure/category.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { EventModule } from './modules/events/infrastructure/event.module';
import { NotificationsModule } from './modules/notifications/infrastructure/notifications.module';
import { SocialModule } from './modules/social/infrastructure/social.module';
import { TenantLicenseGuard } from './common/guards/tenant-license.guard';

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
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: TenantLicenseGuard },
  ],
})
export class AppModule {}
