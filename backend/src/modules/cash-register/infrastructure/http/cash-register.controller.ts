import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '@shared/infrastructure/decorators/current-user.decorator';
import { AuthenticatedUser } from '@shared/infrastructure/types/authenticated-user';

@Controller('cash-register')
export class CashRegisterController {
  @Get()
  async getSummary(@CurrentUser() user: AuthenticatedUser) {
    return {
      message: 'Módulo de Control de Caja / Arqueo (Stub)',
      tenantId: user.tenantId,
      status: 'closed',
    };
  }
}
