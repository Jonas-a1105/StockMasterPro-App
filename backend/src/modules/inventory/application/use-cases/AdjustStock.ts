import { ProductRepository } from '../ports/ProductRepository.interface';
import { Product } from '../../domain/Product';

interface AdjustStockInput {
  productId: string;
  tenantId: string;
  userId: string;
  quantity: number;
  type: string;
  reason?: string;
}

export class AdjustStock {
  constructor(private readonly productRepo: ProductRepository) {}

  async execute(input: AdjustStockInput): Promise<Product> {
    if (input.quantity === 0) {
      throw new Error('La cantidad de ajuste no puede ser cero.');
    }
    const allowedTypes = ['adjustment', 'loss', 'return', 'physical_inventory'];
    if (!allowedTypes.includes(input.type)) {
      throw new Error(`Tipo de movimiento no válido: ${input.type}`);
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
      throw new Error(err.message || 'Error al ajustar el inventario');
    }
  }
}
