import { Module } from '@nestjs/common';
import { PrismaModule } from '@shared/infrastructure/prisma/prisma.module';
import { InventoryController } from './http/inventory.controller';
import { PostgresProductRepo } from './persistence/postgres-product.repository';
import { PRODUCT_REPOSITORY } from '../application/ports/product.repository.interface';
import { CreateProductUseCase } from '../application/use-cases/create-product.use-case';
import { AdjustStockUseCase } from '../application/use-cases/adjust-stock.use-case';
import { FindAllProductsUseCase } from '../application/use-cases/find-all-products.use-case';
import { FindProductByIdUseCase } from '../application/use-cases/find-product-by-id.use-case';
import { UpdateProductUseCase } from '../application/use-cases/update-product.use-case';
import { DeleteProductUseCase } from '../application/use-cases/delete-product.use-case';
import { FindAllAdjustmentsUseCase } from '../application/use-cases/find-all-adjustments.use-case';
import { GetLowStockProductsUseCase } from '../application/use-cases/get-low-stock-products.use-case';
import { GetProductMovementsUseCase } from '../application/use-cases/get-product-movements.use-case';

@Module({
  imports: [PrismaModule],
  controllers: [InventoryController],
  providers: [
    { provide: PRODUCT_REPOSITORY, useClass: PostgresProductRepo },
    CreateProductUseCase,
    AdjustStockUseCase,
    FindAllProductsUseCase,
    FindProductByIdUseCase,
    UpdateProductUseCase,
    DeleteProductUseCase,
    FindAllAdjustmentsUseCase,
    GetLowStockProductsUseCase,
    GetProductMovementsUseCase,
  ],
  exports: [PRODUCT_REPOSITORY, FindProductByIdUseCase],
})
export class InventoryModule {}
