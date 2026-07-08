import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ProcessSaleDto } from '../dto/process-sale.dto';
import { Roles } from '@shared/infrastructure/decorators/roles.decorator';
import { CurrentUser } from '@shared/infrastructure/decorators/current-user.decorator';
import { AuthenticatedUser } from '@shared/infrastructure/types/authenticated-user';
import { ProcessSaleUseCase } from '../../application/use-cases/ProcessSale';
import { ProcessBulkSalesUseCase } from '../../application/use-cases/ProcessBulkSales';
import { FindAllSalesUseCase } from '../../application/use-cases/FindAllSales';
import { FindSaleByIdUseCase } from '../../application/use-cases/FindSaleById';
import { GetDailySalesSummaryUseCase } from '../../application/use-cases/GetDailySalesSummary';
import { PaymentMethod } from '../../domain/Sale';

@Controller('sales')
export class SalesController {
  constructor(
    private readonly processSaleUseCase: ProcessSaleUseCase,
    private readonly processBulkSalesUseCase: ProcessBulkSalesUseCase,
    private readonly findAllSalesUseCase: FindAllSalesUseCase,
    private readonly findSaleByIdUseCase: FindSaleByIdUseCase,
    private readonly getDailySalesSummaryUseCase: GetDailySalesSummaryUseCase,
  ) {}

  @Post()
  @Roles('admin', 'gerente', 'cajero')
  async processSale(@Body() dto: ProcessSaleDto, @CurrentUser() user: AuthenticatedUser) {
    return this.processSaleUseCase.execute({
      tenantId: user.tenantId,
      userId: user.id,
      items: dto.items,
      paymentMethod: (dto.paymentMethod as PaymentMethod) ?? 'cash',
      discount: dto.discount,
      taxRate: dto.taxRate,
      customerId: dto.customerId,
    });
  }

  @Post('bulk')
  @Roles('admin', 'gerente', 'cajero')
  async processBulk(
    @Body() body: { sales: ProcessSaleDto[] },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.processBulkSalesUseCase.execute(body.sales, user);
  }

  @Get()
  @Roles('admin', 'gerente')
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.findAllSalesUseCase.execute(user.tenantId);
  }

  @Get('daily-summary')
  @Roles('admin', 'gerente')
  async getDailySummary(@CurrentUser() user: AuthenticatedUser) {
    return this.getDailySalesSummaryUseCase.execute(user.tenantId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.findSaleByIdUseCase.execute(id, user.tenantId);
  }
}
