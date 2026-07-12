import { Inject, Injectable } from '@nestjs/common';
import {
  InventoryCountRepository,
  INVENTORY_COUNT_REPOSITORY,
} from '../ports/inventory-count.repository.interface';
import { ProductRepository, PRODUCT_REPOSITORY } from '@modules/inventory';
import { WarehouseService } from '@modules/warehouses';
import {
  InventoryCount,
  InventoryCountItem,
  InventoryCountNotFoundException,
} from '@modules/inventory-counts';
import * as crypto from 'crypto';

interface CreateCountInput {
  tenantId: string;
  userId: string;
  warehouseId?: string;
  name?: string;
  notes?: string;
  productIds?: string[];
  productWarehouseIds?: string[];
}

@Injectable()
export class CreateInventoryCountUseCase {
  constructor(
    @Inject(INVENTORY_COUNT_REPOSITORY)
    private readonly countRepo: InventoryCountRepository,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepo: ProductRepository,
    private readonly warehouseService: WarehouseService,
  ) {}

  async execute(input: CreateCountInput): Promise<InventoryCount> {
    if (input.warehouseId) {
      const warehouse = await this.warehouseService.findById(
        input.warehouseId,
        input.tenantId,
      );
      if (!warehouse) throw new Error('Almacén no encontrado');
    }

    const productWarehouseMap = new Map<
      string,
      { productId: string; warehouseId: string }
    >();

    if (input.productIds?.length) {
      const products = await this.productRepo.findByIds(
        input.productIds,
        input.tenantId,
      );
      for (const product of products) {
        const pws = await this.productRepo.getProductWarehouses(
          product.id,
          input.tenantId,
        );
        for (const pw of pws) {
          productWarehouseMap.set(pw.id, {
            productId: product.id,
            warehouseId: pw.warehouseId,
          });
        }
      }
    }

    if (input.productWarehouseIds?.length) {
      for (const pwId of input.productWarehouseIds) {
        const pw = await this.productRepo.getProductWarehouseById(
          pwId,
          input.tenantId,
        );
        if (pw)
          productWarehouseMap.set(pw.id, {
            productId: pw.productId,
            warehouseId: pw.warehouseId,
          });
      }
    }

    const count = InventoryCount.create(
      crypto.randomUUID(),
      input.tenantId,
      input.warehouseId ?? null,
      input.userId,
      input.name ?? null,
    );

    if (productWarehouseMap.size > 0) {
      const systemQuantities = await this.countRepo.getSystemQuantities(
        Array.from(productWarehouseMap.values()).map((v) => v.productId),
        input.tenantId,
        input.warehouseId,
      );

      for (const [pwId, { productId }] of productWarehouseMap) {
        const systemQty = systemQuantities.get(productId) ?? 0;
        count.items.push(
          new InventoryCountItem(
            crypto.randomUUID(),
            input.tenantId,
            count.id,
            productId,
            pwId,
            systemQty,
            null,
            0,
            null,
            new Date(),
            new Date(),
          ),
        );
      }
    }

    return this.countRepo.create(count);
  }
}
