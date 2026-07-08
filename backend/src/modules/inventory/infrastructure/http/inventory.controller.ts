import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { InventoryService } from '../inventory.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { Roles } from '@shared/infrastructure/decorators/roles.decorator';
import { CurrentUser } from '@shared/infrastructure/decorators/current-user.decorator';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('low-stock')
  @Roles('admin', 'gerente', 'vendedor')
  async getLowStock(@CurrentUser() user: any) {
    return this.inventoryService.getLowStock(user.tenantId);
  }

  @Get()
  async findAll(@CurrentUser() user: any) {
    return this.inventoryService.findAll(user.tenantId);
  }

  @Get('adjustments')
  async findAllAdjustments(
    @Query('limit') limit: string,
    @Query('offset') offset: string,
    @CurrentUser() user: any,
  ) {
    return this.inventoryService.findAllAdjustments(
      user.tenantId,
      limit ? Number(limit) : undefined,
      offset ? Number(offset) : undefined,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.inventoryService.findById(id, user.tenantId);
  }

  @Post()
  @Roles('admin', 'gerente')
  async create(@Body() dto: CreateProductDto, @CurrentUser() user: any) {
    return this.inventoryService.create({ ...dto, tenantId: user.tenantId });
  }

  @Patch(':id')
  @Roles('admin', 'gerente')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: any,
  ) {
    return this.inventoryService.update(id, user.tenantId, dto);
  }

  @Delete(':id')
  @Roles('admin')
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.inventoryService.delete(id, user.tenantId);
  }

  @Post(':id/adjust')
  @Roles('admin', 'gerente')
  async adjustStock(
    @Param('id') id: string,
    @Body() body: { quantity: number; type: string; reason?: string },
    @CurrentUser() user: any,
  ) {
    return this.inventoryService.adjustStock(id, user.tenantId, user.id, body);
  }

  @Get(':id/movements')
  async getMovements(
    @Param('id') id: string,
    @Query('limit') limit: string,
    @Query('offset') offset: string,
    @CurrentUser() user: any,
  ) {
    return this.inventoryService.getMovements(
      id,
      user.tenantId,
      limit ? Number(limit) : undefined,
      offset ? Number(offset) : undefined,
    );
  }
}
