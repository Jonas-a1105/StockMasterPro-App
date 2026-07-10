export class SaleItem {
  constructor(
    public readonly productId: string,
    public quantity: number,
    public price: number,
    public cost: number,
    public taxRate: number = 0,
    public discount: number = 0,
    public subtotal: number,
  ) {}

  static create(
    productId: string,
    quantity: number,
    price: number,
    cost: number,
    taxRate: number = 0,
    discount: number = 0,
  ): SaleItem {
    const subtotal = price * quantity;
    const discountAmount = subtotal * (discount / 100);
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * (taxRate / 100);
    return new SaleItem(
      productId,
      quantity,
      price,
      cost,
      taxRate,
      discount,
      subtotal - discountAmount + taxAmount,
    );
  }

  get discountAmount(): number {
    return this.price * this.quantity * (this.discount / 100);
  }

  get taxableAmount(): number {
    return this.price * this.quantity - this.discountAmount;
  }

  get taxAmount(): number {
    return this.taxableAmount * (this.taxRate / 100);
  }
}
