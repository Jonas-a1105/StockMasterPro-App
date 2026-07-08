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
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { Roles } from '@shared/infrastructure/decorators/roles.decorator';
import { CurrentUser } from '@shared/infrastructure/decorators/current-user.decorator';
import { AuthenticatedUser } from '@shared/infrastructure/types/authenticated-user';
import { CreateProductUseCase } from '../../application/use-cases/create-product.use-case';
import { AdjustStockUseCase } from '../../application/use-cases/adjust-stock.use-case';
import { FindAllProductsUseCase } from '../../application/use-cases/find-all-products.use-case';
import { FindProductByIdUseCase } from '../../application/use-cases/find-product-by-id.use-case';
import { UpdateProductUseCase } from '../../application/use-cases/update-product.use-case';
import { DeleteProductUseCase } from '../../application/use-cases/delete-product.use-case';
import { FindAllAdjustmentsUseCase } from '../../application/use-cases/find-all-adjustments.use-case';
import { GetLowStockProductsUseCase } from '../../application/use-cases/get-low-stock-products.use-case';
import { GetProductMovementsUseCase } from '../../application/use-cases/get-product-movements.use-case';

@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly getLowStockUseCase: GetLowStockProductsUseCase,
    private readonly findAllProductsUseCase: FindAllProductsUseCase,
    private readonly findAllAdjustmentsUseCase: FindAllAdjustmentsUseCase,
    private readonly findProductByIdUseCase: FindProductByIdUseCase,
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly updateProductUseCase: UpdateProductUseCase,
    private readonly deleteProductUseCase: DeleteProductUseCase,
    private readonly adjustStockUseCase: AdjustStockUseCase,
    private readonly getProductMovementsUseCase: GetProductMovementsUseCase,
  ) {}

  @Get('low-stock')
  @Roles('admin', 'gerente', 'vendedor')
  async getLowStock(@CurrentUser() user: AuthenticatedUser) {
    return this.getLowStockUseCase.execute(user.tenantId);
  }

  @Get()
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.findAllProductsUseCase.execute(user.tenantId);
  }

  @Get('adjustments')
  async findAllAdjustments(
    @Query('limit') limit: string,
    @Query('offset') offset: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.findAllAdjustmentsUseCase.execute(
      user.tenantId,
      limit ? Number(limit) : undefined,
      offset ? Number(offset) : undefined,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.findProductByIdUseCase.execute(id, user.tenantId);
  }

  @Post()
  @Roles('admin', 'gerente')
  async create(@Body() dto: CreateProductDto, @CurrentUser() user: AuthenticatedUser) {
    return this.createProductUseCase.execute({ ...dto, tenantId: user.tenantId });
  }

  @Patch(':id')
  @Roles('admin', 'gerente')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.updateProductUseCase.execute(id, user.tenantId, dto);
  }

  @Delete(':id')
  @Roles('admin')
  async delete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.deleteProductUseCase.execute(id, user.tenantId);
  }

  @Post(':id/adjust')
  @Roles('admin', 'gerente')
  async adjustStock(
    @Param('id') id: string,
    @Body() body: { quantity: number; type: string; reason?: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.adjustStockUseCase.execute({
      productId: id,
      tenantId: user.tenantId,
      userId: user.id,
      quantity: body.quantity,
      type: body.type,
      reason: body.reason,
    });
  }

  @Get(':id/movements')
  async getMovements(
    @Param('id') id: string,
    @Query('limit') limit: string,
    @Query('offset') offset: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.getProductMovementsUseCase.execute(
      id,
      user.tenantId,
      limit ? Number(limit) : undefined,
      offset ? Number(offset) : undefined,
    );
  }
}
