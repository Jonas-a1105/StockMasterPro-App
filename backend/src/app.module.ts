import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { RLSInterceptor } from '@shared/infrastructure/http/interceptors/rls.interceptor';
import { TransformInterceptor } from '@shared/infrastructure/http/interceptors/transform.interceptor';
import { PrismaModule } from '@shared/infrastructure/prisma/prisma.module';
import { AuthPrismaModule } from '@shared/infrastructure/prisma/auth-prisma.module';
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
import { ProductLotModule } from './modules/product-lots/infrastructure/product-lot.module';
import { SocialModule } from './modules/social';
import { AccountsReceivableModule } from './modules/accounts-receivable';
import { CashRegisterModule } from './modules/cash-register';
import { TenantSettingsModule } from './modules/tenant-settings/infrastructure/tenant-settings.module';
import { WarehouseTransferModule } from './modules/warehouse-transfers/infrastructure/warehouse-transfer.module';

import { JwtAuthGuard } from '@shared/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '@shared/infrastructure/guards/roles.guard';
import { TenantLicenseGuard } from '@shared/infrastructure/guards/tenant-license.guard';

import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { UploadModule } from './modules/uploads/infrastructure/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthPrismaModule,
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
      serveRoot: '/',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
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
    ProductLotModule,
    SocialModule,
    AccountsReceivableModule,
    CashRegisterModule,
    TenantSettingsModule,
    WarehouseTransferModule,
    UploadModule,
  ],
  providers: [
    // Order matters: Throttle → Auth → Roles → License
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: TenantLicenseGuard },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_INTERCEPTOR, useClass: RLSInterceptor },
  ],
})
export class AppModule {}
