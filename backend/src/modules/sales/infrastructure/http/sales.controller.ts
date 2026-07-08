import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ProcessSaleDto } from '../dto/process-sale.dto';
import { Roles } from '@shared/infrastructure/decorators/roles.decorator';
import { CurrentUser } from '@shared/infrastructure/decorators/current-user.decorator';
import { AuthenticatedUser } from '@shared/infrastructure/types/authenticated-user';
import { ProcessSaleUseCase } from '../../application/use-cases/process-sale.use-case';
import { ProcessBulkSalesUseCase } from '../../application/use-cases/process-bulk-sales.use-case';
import { FindAllSalesUseCase } from '../../application/use-cases/find-all-sales.use-case';
import { FindSaleByIdUseCase } from '../../application/use-cases/find-sale-by-id.use-case';
import { GetDailySalesSummaryUseCase } from '../../application/use-cases/get-daily-sales-summary.use-case';
import { PaymentMethod } from '../../domain/sale.entity';

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
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.findAllSalesUseCase.execute(user.tenantId, Number(page) || 1, Number(limit) || 50);
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
