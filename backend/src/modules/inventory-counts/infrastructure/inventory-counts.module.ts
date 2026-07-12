import { Module } from '@nestjs/common';
import { InventoryCountController } from '@modules/inventory-counts/infrastructure/http/inventory-count.controller';
import { PostgresInventoryCountRepo } from '@modules/inventory-counts/infrastructure/persistence/postgres-inventory-count.repository';
import { CreateInventoryCountUseCase } from '@modules/inventory-counts/application/use-cases/create-inventory-count.use-case';
import { FindInventoryCountUseCase } from '@modules/inventory-counts/application/use-cases/find-inventory-count.use-case';
import { StartInventoryCountUseCase, CompleteInventoryCountUseCase, ApproveInventoryCountUseCase, CancelInventoryCountUseCase, UpdateInventoryCountUseCase } from '@modules/inventory-counts/application/use-cases/update-inventory-count.use-case';
import { UpdateInventoryCountItemUseCase } from '@modules/inventory-counts/application/use-cases/update-inventory-count-item.use-case';
import { ApplyInventoryCountAdjustmentsUseCase } from '@modules/inventory-counts/application/use-cases/apply-inventory-count-adjustments.use-case';
import { INVENTORY_COUNT_REPOSITORY } from '@modules/inventory-counts/application/ports/inventory-count.repository.interface';

@Module({
  controllers: [InventoryCountController],
  providers: [
    CreateInventoryCountUseCase,
    FindInventoryCountUseCase,
    {
      provide: INVENTORY_COUNT_REPOSITORY,
      useClass: PostgresInventoryCountRepo,
    },
  ],
  exports: [INVENTORY_COUNT_REPOSITORY],
})
export class InventoryCountsModule {}