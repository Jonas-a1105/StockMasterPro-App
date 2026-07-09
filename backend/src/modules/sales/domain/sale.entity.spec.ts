import { Sale, PaymentMethod, SaleStatus } from './sale.entity';
import { SaleItem } from './sale-item.entity';

describe('Sale Entity', () => {
  describe('calculateTotal', () => {
    it('should compute subtotal from items', () => {
      const items = [
        { price: 100, quantity: 2 },
        { price: 50, quantity: 1 },
      ];
      const result = Sale.calculateTotal(items);
      expect(result.subtotal).toBe(250);
      expect(result.tax).toBe(0);
      expect(result.discount).toBe(0);
      expect(result.total).toBe(250);
    });

    it('should apply percentage discount', () => {
      const items = [{ price: 200, quantity: 1 }];
      const result = Sale.calculateTotal(items, 10); // 10% discount
      expect(result.subtotal).toBe(200);
      expect(result.discount).toBe(20);
      expect(result.total).toBe(180);
    });

    it('should apply tax rate on discounted amount', () => {
      const items = [{ price: 100, quantity: 1 }];
      const result = Sale.calculateTotal(items, 0, 16); // 16% tax
      expect(result.subtotal).toBe(100);
      expect(result.tax).toBe(16);
      expect(result.total).toBe(116);
    });

    it('should apply both discount and tax', () => {
      const items = [{ price: 200, quantity: 2 }];
      const result = Sale.calculateTotal(items, 10, 16);
      // subtotal: 400, discount: 40, taxable: 360, tax: 57.6, total: 417.6
      expect(result.subtotal).toBe(400);
      expect(result.discount).toBe(40);
      expect(result.tax).toBe(57.6);
      expect(result.total).toBe(417.6);
    });

    it('should handle multiple items with zero discount and tax', () => {
      const items = [
        { price: 15.5, quantity: 3 },
        { price: 10.25, quantity: 2 },
      ];
      const result = Sale.calculateTotal(items);
      // subtotal: 46.5 + 20.5 = 67
      expect(result.subtotal).toBe(67);
      expect(result.total).toBe(67);
    });

    it('should round tax and discount to 2 decimals', () => {
      const items = [{ price: 33.33, quantity: 3 }];
      const result = Sale.calculateTotal(items, 10, 7.5);
      // subtotal: 99.99, discount: 9.999 -> 10, taxable: 89.99, tax: 6.74925 -> 6.75, total: 96.74
      expect(result.subtotal).toBe(99.99);
      expect(result.discount).toBe(10);
      expect(result.tax).toBe(6.75);
      expect(result.total).toBe(96.74);
    });
  });

  describe('constructor', () => {
    it('should create a sale with all properties', () => {
      const items = [SaleItem.create('prod-1', 2, 100, 60)];
      const sale = new Sale(
        'sale-1',
        'tenant-1',
        'user-1',
        'customer-1',
        200,
        0,
        0,
        200,
        'cash',
        'completed',
        items,
        new Date('2026-07-08'),
      );

      expect(sale.id).toBe('sale-1');
      expect(sale.tenantId).toBe('tenant-1');
      expect(sale.userId).toBe('user-1');
      expect(sale.customerId).toBe('customer-1');
      expect(sale.paymentMethod).toBe('cash');
      expect(sale.status).toBe('completed');
      expect(sale.items).toHaveLength(1);
    });

    it('should allow null customerId', () => {
      const sale = new Sale(
        'sale-2',
        'tenant-1',
        'user-1',
        null,
        100,
        0,
        0,
        100,
        'credit',
        'completed',
        [],
        new Date(),
      );
      expect(sale.customerId).toBeNull();
    });
  });
});
