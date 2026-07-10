import type { Product, CartItem } from '@types';

export interface PausedCart {
  id: string;
  name: string;
  items: CartItem[];
}

export interface LastSale {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  date: Date;
  customerName?: string;
}

export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'mobile' | 'credit' | 'mixed';
