import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '@shared/infrastructure/decorators/current-user.decorator';

@Controller('cash-register')
export class CashRegisterController {
  @Get()
  async getSummary(@CurrentUser() user: any) {
    return {
      message: 'Módulo de Control de Caja / Arqueo (Stub)',
      tenantId: user.tenantId,
      status: 'closed',
    };
  }
}
