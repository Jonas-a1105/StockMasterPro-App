import { SaleItem } from './sale-item.entity';
import { SalePayment } from './sale-payment.entity';

export type PaymentMethod = 'cash' | 'card' | 'credit' | 'transfer' | 'mobile';
export type SaleStatus = 'completed' | 'cancelled';

export class Sale {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly userId: string,
    public readonly customerId: string | null,
    public subtotal: number,
    public tax: number,
    public discount: number,
    public total: number,
    public paymentMethod: PaymentMethod,
    public status: SaleStatus,
    public readonly items: SaleItem[],
    public readonly createdAt: Date,
    public invoiceNumber?: string | null,
    public invoiceSeries?: string | null,
    public documentType?: string | null,
    public readonly payments?: SalePayment[],
  ) {}

  static calculateTotal(
    items: {
      price: number;
      quantity: number;
      discount?: number;
      taxRate?: number;
    }[],
    discount: number = 0,
    taxRate: number = 0,
  ): { subtotal: number; tax: number; discount: number; total: number } {
    let subtotal = 0;
    let totalDiscount = 0;

    for (const item of items) {
      const itemSubtotal = item.price * item.quantity;
      const itemDiscount = itemSubtotal * ((item.discount ?? 0) / 100);

      subtotal += itemSubtotal;
      totalDiscount += itemDiscount;
    }

    const globalDiscountAmount = subtotal * (discount / 100);
    totalDiscount += globalDiscountAmount;

    const taxableAfterDiscount = subtotal - totalDiscount;
    const tax = taxableAfterDiscount * (taxRate / 100);
    const total = taxableAfterDiscount + tax;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      discount: Math.round(totalDiscount * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }
}
