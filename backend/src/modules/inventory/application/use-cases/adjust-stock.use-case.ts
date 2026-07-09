import { Inject, Injectable } from '@nestjs/common';
import {
  ProductRepository,
  PRODUCT_REPOSITORY,
} from '../ports/product.repository.interface';
import { Product } from '../../domain/product.entity';
import { InvalidStockAdjustmentException } from '../../domain/inventory.errors';

interface AdjustStockInput {
  productId: string;
  tenantId: string;
  userId: string;
  quantity: number;
  type: string;
  reason?: string;
}

@Injectable()
export class AdjustStockUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepo: ProductRepository,
  ) {}

  async execute(input: AdjustStockInput): Promise<Product> {
    if (input.quantity === 0) {
      throw new InvalidStockAdjustmentException(
        'La cantidad de ajuste no puede ser cero.',
      );
    }
    const allowedTypes = ['adjustment', 'loss', 'return', 'physical_inventory'];
    if (!allowedTypes.includes(input.type)) {
      throw new InvalidStockAdjustmentException(
        `Tipo de movimiento no válido: ${input.type}`,
      );
    }

    try {
      return await this.productRepo.adjustStock(
        input.productId,
        input.tenantId,
        input.userId,
        {
          quantity: input.quantity,
          type: input.type,
          reason: input.reason,
        },
      );
    } catch (err: any) {
      throw new InvalidStockAdjustmentException(
        err.message || 'Error al ajustar el inventario',
      );
    }
  }
}
