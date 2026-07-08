import { Module } from '@nestjs/common';
import { PrismaModule } from '@shared/infrastructure/prisma/prisma.module';
import { InventoryController } from './http/inventory.controller';
import { PostgresProductRepo } from './persistence/PostgresProductRepo';
import { PRODUCT_REPOSITORY } from '../application/ports/ProductRepository.interface';
import { CreateProductUseCase } from '../application/use-cases/CreateProduct';
import { AdjustStockUseCase } from '../application/use-cases/AdjustStock';
import { FindAllProductsUseCase } from '../application/use-cases/FindAllProducts';
import { FindProductByIdUseCase } from '../application/use-cases/FindProductById';
import { UpdateProductUseCase } from '../application/use-cases/UpdateProduct';
import { DeleteProductUseCase } from '../application/use-cases/DeleteProduct';
import { FindAllAdjustmentsUseCase } from '../application/use-cases/FindAllAdjustments';
import { GetLowStockProductsUseCase } from '../application/use-cases/GetLowStockProducts';
import { GetProductMovementsUseCase } from '../application/use-cases/GetProductMovements';

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
