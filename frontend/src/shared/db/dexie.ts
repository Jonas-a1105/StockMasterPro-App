import Dexie, { type Table } from 'dexie';

export interface OfflineProduct {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  barcode: string | null;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  categoryId: string | null;
  isActive: boolean;
}

export interface OfflineSale {
  id?: number;
  tenantId: string;
  userId: string;
  items: string;
  total: number;
  paymentMethod: string;
  createdAt: string;
  synced: boolean;
  idempotencyKey: string;
  retryCount: number;
}

export interface LicenseData {
  id?: number;
  tenantId: string;
  token: string;
  expiresAt: string;
  tier: string;
}

class StockMasterDB extends Dexie {
  products!: Table<OfflineProduct, string>;
  offlineSales!: Table<OfflineSale, number>;
  licenses!: Table<LicenseData, number>;

  constructor() {
    super('StockMasterDB');
    this.version(2).stores({
      products: 'id, tenantId, barcode, name',
      offlineSales: '++id, tenantId, synced, createdAt, idempotencyKey',
      licenses: '++id, tenantId',
    });
  }
}

export const db = new StockMasterDB();
