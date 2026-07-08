export class SaleItem {
  constructor(
    public readonly productId: string,
    public quantity: number,
    public price: number,
    public cost: number,
    public subtotal: number,
  ) {}

  static create(
    productId: string,
    quantity: number,
    price: number,
    cost: number,
  ): SaleItem {
    return new SaleItem(productId, quantity, price, cost, price * quantity);
  }
}
