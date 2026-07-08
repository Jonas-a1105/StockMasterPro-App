import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '@shared/infrastructure/decorators/current-user.decorator';
import { AuthenticatedUser } from '@shared/infrastructure/types/authenticated-user';

@Controller('accounts-receivable')
export class AccountsReceivableController {
  @Get()
  async getSummary(@CurrentUser() user: AuthenticatedUser) {
    return {
      message: 'Módulo de Cuentas por Cobrar (Stub)',
      tenantId: user.tenantId,
      items: [],
    };
  }
}
