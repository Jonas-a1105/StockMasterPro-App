import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { ExchangeRateService } from '../exchange-rate.service';
import { JwtAuthGuard } from '@shared/infrastructure/guards/jwt-auth.guard';
import { CurrentUser } from '@shared/infrastructure/decorators/current-user.decorator';
import { AuthenticatedUser } from '@shared/infrastructure/types/authenticated-user';
import { Public } from '@shared/infrastructure/decorators/public.decorator';

@Controller('exchange-rate')
@UseGuards(JwtAuthGuard)
export class ExchangeRateController {
  constructor(private readonly service: ExchangeRateService) {}

  @Get('dolar')
  async getDolarRate(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getDolarRate(user.tenantId);
  }

  @Get('convert')
  async convert(
    @Query('amount') amount: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const usd = parseFloat(amount) || 1;
    return this.service.convertPrice(usd, user.tenantId);
  }

  @Get('history')
  async getHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Query('limit') limit = '100',
  ) {
    return this.service.getHistory(user.tenantId, parseInt(limit));
  }

  @Post('manual')
  async setManualRate(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { rate: number },
  ) {
    return this.service.saveRate(user.tenantId, body.rate, 'manual');
  }
}
