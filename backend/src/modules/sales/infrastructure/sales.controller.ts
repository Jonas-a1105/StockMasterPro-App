import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { SalesService } from './sales.service';
import { ProcessSaleDto } from './dto/process-sale.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@Controller('sales')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @Roles('admin', 'gerente', 'cajero')
  async processSale(@Body() dto: ProcessSaleDto, @CurrentUser() user: any) {
    return this.salesService.processSale({
      ...dto,
      tenantId: user.tenantId,
      userId: user.id,
    });
  }

  @Post('bulk')
  @Roles('admin', 'gerente', 'cajero')
  async processBulk(
    @Body() body: { sales: ProcessSaleDto[] },
    @CurrentUser() user: any,
  ) {
    return this.salesService.processBulkSales(body.sales, user);
  }

  @Get()
  @Roles('admin', 'gerente')
  async findAll(@CurrentUser() user: any) {
    return this.salesService.findAll(user.tenantId);
  }

  @Get('daily-summary')
  @Roles('admin', 'gerente')
  async getDailySummary(@CurrentUser() user: any) {
    return this.salesService.getDailySummary(user.tenantId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.salesService.findById(id, user.tenantId);
  }
}
