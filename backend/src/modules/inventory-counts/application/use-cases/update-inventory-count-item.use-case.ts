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
import {
  InventoryCount,
  InventoryCountNotFoundException,
  InventoryCountInvalidStateException,
} from '@modules/inventory-counts';

interface UpdateCountItemInput {
  countId: string;
  itemId: string;
  tenantId: string;
  countedQty: number;
  notes?: string;
}

@Injectable()
export class UpdateInventoryCountItemUseCase {
  constructor(
    @Inject(INVENTORY_COUNT_REPOSITORY)
    private readonly countRepo: InventoryCountRepository,
  ) {}

  async execute(input: UpdateCountItemInput): Promise<void> {
    const count = await this.countRepo.findById(input.countId, input.tenantId);
    if (!count) throw new NotFoundException('Conteo no encontrado');

    if (!count.canEdit()) {
      throw new BadRequestException(
        'No se puede editar un conteo en estado ' + count.status,
      );
    }

    const item = await this.countRepo.getItem(input.itemId, input.tenantId);
    if (!item) throw new NotFoundException('Ítem de conteo no encontrado');
    if (item.inventoryCountId !== input.countId) {
      throw new BadRequestException('El ítem no pertenece a este conteo');
    }

    item.setCountedQty(input.countedQty);
    if (input.notes !== undefined) {
      item.notes = input.notes;
    }

    await this.countRepo.updateItem(item);
  }
}
