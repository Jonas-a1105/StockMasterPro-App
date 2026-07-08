import { Controller, Get, Query } from '@nestjs/common';
import { ExchangeRateService } from '../exchange-rate.service';
import { Public } from '@shared/infrastructure/decorators/public.decorator';

@Public()
@Controller('exchange-rate')
export class ExchangeRateController {
  constructor(private readonly service: ExchangeRateService) {}

  @Get('dolar')
  async getDolarRate() {
    return this.service.getDolarRate();
  }

  @Get('convert')
  async convert(@Query('amount') amount: string) {
    const usd = parseFloat(amount) || 1;
    return this.service.convertPrice(usd);
  }
}
