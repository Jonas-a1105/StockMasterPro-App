import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { PurchaseOrderService } from '../purchase-order.service';
import { CreatePurchaseOrderDto } from '../dto/create-purchase-order.dto';
import { Roles } from '@shared/infrastructure/decorators/roles.decorator';
import { CurrentUser } from '@shared/infrastructure/decorators/current-user.decorator';
import { AuthenticatedUser } from '@shared/infrastructure/types/authenticated-user';

@Controller('purchase-orders')
export class PurchaseOrderController {
  constructor(private readonly purchaseOrderService: PurchaseOrderService) {}

  @Get()
  @Roles('admin', 'gerente')
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.purchaseOrderService.findAll(user.tenantId);
  }

  @Get(':id')
  @Roles('admin', 'gerente')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.purchaseOrderService.findById(id, user.tenantId);
  }

  @Post()
  @Roles('admin', 'gerente')
  async create(
    @Body() dto: CreatePurchaseOrderDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.purchaseOrderService.create({
      ...dto,
      tenantId: user.tenantId,
      userId: user.id,
    });
  }

  @Patch(':id/receive')
  @Roles('admin', 'gerente')
  async receive(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.purchaseOrderService.receiveOrder(id, user.tenantId);
  }
}
