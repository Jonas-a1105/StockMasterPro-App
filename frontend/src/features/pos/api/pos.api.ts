import { api } from '@shared/lib/http/client';

export function searchProducts() {
  return api.get<any[]>('/inventory');
}

export function processSale(data: {
  items: { productId: string; quantity: number }[];
  paymentMethod: string;
  taxRate?: number;
  customerId?: string;
}) {
  return api.post<any>('/sales', data);
}

export function getWarehouses() {
  return api.get<any[]>('/warehouses');
}

export function getCustomers() {
  return api.get<any[]>('/customers');
}
