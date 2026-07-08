export class CreditNoteItem {
  constructor(
    public readonly id: string,
    public readonly creditNoteId: string,
    public readonly productId: string,
    public readonly quantity: number,
    public readonly price: number,
    public readonly subtotal: number,
  ) {}
}
