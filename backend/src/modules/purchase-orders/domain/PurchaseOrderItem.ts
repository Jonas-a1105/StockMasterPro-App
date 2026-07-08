export class PurchaseOrderItem {
  constructor(
    public readonly productId: string,
    public readonly quantity: number,
    public readonly cost: number,
    public readonly subtotal: number,
  ) {}
}
