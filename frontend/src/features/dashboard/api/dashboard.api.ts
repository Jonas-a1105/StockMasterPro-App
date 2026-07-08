import { api } from '@shared/lib/http/client';

export function getDailySummary() {
  return api.get<{ total: number; count: number }>('/sales/daily-summary');
}

export function getDashboardProducts() {
  return api.get<any[]>('/inventory');
}

export function getDashboardSales(limit = 100) {
  return api.get<any[]>(`/sales?limit=${limit}`);
}
