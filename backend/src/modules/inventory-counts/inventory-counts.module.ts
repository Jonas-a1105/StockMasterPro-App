import { Module } from '@nestjs/common';
import { InventoryCountController } from './infrastructure/http/inventory-count.controller';
import {
  CreateInventoryCountUseCase,
} from './application/use-cases/create-inventory-count.use-case';
import {
  FindInventoryCountUseCase,
} from './application/use-cases/find-inventory-count.use-case';
import {
  StartInventoryCountUseCase,
  CompleteInventoryCountUseCase,
  ApproveInventoryCountUseCase,
  CancelInventoryCountUseCase,
  UpdateInventoryCountUseCase,
} from './application/use-cases/update-inventory-count.use-case';
import {
  UpdateInventoryCountItemUseCase,
} from './application/use-cases/update-inventory-count-item.use-case';
import {
  ApplyInventoryCountAdjustmentsUseCase,
} from './application/use-cases/apply-inventory-count-adjustments.use-case';
import { PostgresInventoryCountRepo } from './infrastructure/persistence/postgres-inventory-count.repository';
import { INVENTORY_COUNT_REPOSITORY } from './application/ports/inventory-count.repository.interface';

@Module({
  controllers: [InventoryCountController],
  providers: [
    CreateInventoryCountUseCase,
    FindInventoryCountUseCase,
    UpdateInventoryCountUseCase,
    UpdateInventoryCountItemUseCase,
    ApplyInventoryCountAdjustmentsUseCase,
    {
      provide: 'INVENTORY_COUNT_REPOSITORY',
      useClass: PostgresInventoryCountRepo,
    },
  ],
  exports: ['INVENTORY_COUNT_REPOSITORY'],
})
export class InventoryCountsModule {}