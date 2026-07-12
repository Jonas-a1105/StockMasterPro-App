import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  InventoryCountRepository,
  INVENTORY_COUNT_REPOSITORY,
} from '../ports/inventory-count.repository.interface';
import {
  InventoryCount,
  InventoryCountNotFoundException,
} from '@modules/inventory-counts';

@Injectable()
export class FindInventoryCountUseCase {
  constructor(
    @Inject(INVENTORY_COUNT_REPOSITORY)
    private readonly countRepo: InventoryCountRepository,
  ) {}

  async findById(id: string, tenantId: string): Promise<InventoryCount> {
    const count = await this.countRepo.findById(id, tenantId);
    if (!count)
      throw new NotFoundException('Conteo de inventario no encontrado');
    return count;
  }

  async findAll(
    tenantId: string,
    filters?: { status?: string; warehouseId?: string; search?: string },
    limit = 50,
    offset = 0,
  ): Promise<{ data: InventoryCount[]; total: number }> {
    const [data, total] = await Promise.all([
      this.countRepo.findAll(tenantId, filters, limit, offset),
      this.countRepo.count(tenantId, filters),
    ]);
    return { data, total };
  }
}
