import { Inject, Injectable } from '@nestjs/common';
import { SaleRepository, SALES_REPOSITORY } from '../ports/sale.repository.interface';
import { ProductRepository, PRODUCT_REPOSITORY } from '@modules/inventory';
import { Sale, PaymentMethod, SaleItem } from '../../domain';
import { ProductNotFoundException, InsufficientStockException } from '../../domain/sales.errors';
import * as crypto from 'crypto';


interface ProcessSaleItem {
  productId: string;
  quantity: number;
}

interface ProcessSaleInput {
  tenantId: string;
  userId: string;
  customerId?: string;
  items: ProcessSaleItem[];
  paymentMethod: PaymentMethod;
  discount?: number;
  taxRate?: number;
}

@Injectable()
export class ProcessSaleUseCase {
  constructor(
    @Inject(SALES_REPOSITORY)
    private readonly saleRepo: SaleRepository,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepo: ProductRepository,
  ) { }

  async execute(input: ProcessSaleInput): Promise<Sale> {
    const productIds = input.items.map((i) => i.productId);
    const products = await this.productRepo.findByIds(productIds, input.tenantId);

    const productMap = new Map(
      products.filter(Boolean).map((p) => [p!.id, p!]),
    );
    const saleItems: SaleItem[] = [];

    for (const item of input.items) {
      const product = productMap.get(item.productId);
      if (!product) throw new ProductNotFoundException(item.productId);
      if (product.stock < item.quantity)
        throw new InsufficientStockException(product.name, product.stock, item.quantity);
      saleItems.push(
        SaleItem.create(product.id, item.quantity, product.price, product.cost),
      );
    }

    const { subtotal, tax, discount, total } = Sale.calculateTotal(
      saleItems.map((i) => ({ price: i.price, quantity: i.quantity })),
      input.discount ?? 0,
      input.taxRate ?? 0,
    );

    const sale = new Sale(
      crypto.randomUUID(),
      input.tenantId,
      input.userId,
      input.customerId ?? null,
      subtotal,
      tax,
      discount,
      total,
      input.paymentMethod,
      'completed',
      saleItems,
      new Date(),
    );

    return this.saleRepo.create(sale);
  }
}
