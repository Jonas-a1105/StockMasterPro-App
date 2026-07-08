import { Product } from '../../domain/product.entity';

export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');

export interface CreateProductData {
  tenantId: string;
  name: string;
  description: string | null;
  barcode: string | null;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  categoryId: string | null;
  imageUrl?: string | null;
  brand?: string | null;
}

export interface ProductRepository {
  findById(id: string, tenantId: string): Promise<Product | null>;
  findByBarcode(barcode: string, tenantId: string): Promise<Product | null>;
  findAll(tenantId: string, limit?: number, offset?: number): Promise<Product[]>;
  count(tenantId: string): Promise<number>;
  findByIds(ids: string[], tenantId: string): Promise<Product[]>;
  create(data: CreateProductData): Promise<Product>;
  update(
    id: string,
    tenantId: string,
    data: Partial<CreateProductData>,
  ): Promise<Product>;
  delete(id: string, tenantId: string): Promise<void>;
  addMovement(data: {
    tenantId: string;
    productId: string;
    type: string;
    quantity: number;
    reference?: string;
    notes?: string;
    userId: string;
  }): Promise<void>;
  findLowStock(tenantId: string): Promise<Product[]>;
  getMovements(
    productId: string,
    tenantId: string,
    limit?: number,
    offset?: number,
  ): Promise<any[]>;
  findAllAdjustments(
    tenantId: string,
    limit?: number,
    offset?: number,
  ): Promise<any[]>;
  adjustStock(
    productId: string,
    tenantId: string,
    userId: string,
    data: { quantity: number; type: string; reason?: string },
  ): Promise<Product>;
}
