export class Product {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public name: string,
    public description: string | null,
    public barcode: string | null,
    public price: number,
    public cost: number,
    public stock: number,
    public minStock: number,
    public categoryId: string | null,
    public isActive: boolean,
    public imageUrl: string | null = null,
    public brand: string | null = null,
  ) {}

  get profitMargin(): number {
    if (this.cost === 0) return 0;
    return ((this.price - this.cost) / this.price) * 100;
  }

  isLowStock(): boolean {
    return this.stock <= this.minStock;
  }

  updateStock(quantity: number): void {
    this.stock += quantity;
  }
}
