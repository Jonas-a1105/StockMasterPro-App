import type { Product, InventoryMovement } from '@types';
export type { Product, InventoryMovement };

export type SortField = 'name' | 'price' | 'stock' | 'status' | 'none';
export type SortDirection = 'asc' | 'desc';
export type ViewMode = 'table' | 'cards';
