import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { PurchaseOrderService } from '../purchase-order.service';
import { CreatePurchaseOrderDto } from '../dto/create-purchase-order.dto';
import { Roles } from '@shared/infrastructure/decorators/roles.decorator';
import { CurrentUser } from '@shared/infrastructure/decorators/current-user.decorator';

@Controller('purchase-orders')
export class PurchaseOrderController {
  constructor(private readonly purchaseOrderService: PurchaseOrderService) {}

  @Get()
  @Roles('admin', 'gerente')
  async findAll(@CurrentUser() user: any) {
    return this.purchaseOrderService.findAll(user.tenantId);
  }

  @Get(':id')
  @Roles('admin', 'gerente')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.purchaseOrderService.findById(id, user.tenantId);
  }

  @Post()
  @Roles('admin', 'gerente')
  async receive(@Body() dto: CreatePurchaseOrderDto, @CurrentUser() user: any) {
    return this.purchaseOrderService.receive({
      ...dto,
      tenantId: user.tenantId,
      userId: user.id,
    });
  }
}
