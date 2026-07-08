import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '@shared/infrastructure/decorators/current-user.decorator';

@Controller('accounts-receivable')
export class AccountsReceivableController {
  @Get()
  async getSummary(@CurrentUser() user: any) {
    return {
      message: 'Módulo de Cuentas por Cobrar (Stub)',
      tenantId: user.tenantId,
      items: [],
    };
  }
}
