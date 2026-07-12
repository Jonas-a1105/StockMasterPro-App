import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  InventoryCountRepository,
  INVENTORY_COUNT_REPOSITORY,
} from '../ports/inventory-count.repository.interface';
import { ProductRepository, PRODUCT_REPOSITORY } from '@modules/inventory';
import { InventoryCount } from '@modules/inventory-counts';

interface ApplyAdjustmentsInput {
  countId: string;
  tenantId: string;
  userId: string;
}

@Injectable()
export class ApplyInventoryCountAdjustmentsUseCase {
  constructor(
    @Inject(INVENTORY_COUNT_REPOSITORY)
    private readonly countRepo: InventoryCountRepository,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepo: ProductRepository,
  ) {}

  async execute(
    input: ApplyAdjustmentsInput,
  ): Promise<{ applied: number; skipped: number }> {
    const count = await this.countRepo.findById(input.countId, input.tenantId);
    if (!count) throw new NotFoundException('Conteo no encontrado');

    if (count.status !== 'approved') {
      throw new BadRequestException(
        'Solo se pueden aplicar ajustes de conteos aprobados',
      );
    }

    let applied = 0;
    let skipped = 0;

    for (const item of count.items) {
      if (item.difference === 0) {
        skipped++;
        continue;
      }

      await this.productRepo.adjustStock(
        item.productId,
        input.tenantId,
        input.userId,
        {
          quantity: item.difference,
          type: 'physical_inventory',
          reason: `Ajuste por conteo físico: ${count.name || count.id}`,
        },
      );

      applied++;
    }

    return { applied, skipped };
  }
}
