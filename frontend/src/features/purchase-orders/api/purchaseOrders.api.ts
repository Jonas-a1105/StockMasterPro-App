import { api } from '@shared/lib/http/client';

export function getPurchaseOrders() {
  return api.get<any[]>('/purchase-orders');
}
export function createPurchaseOrder(data: any) {
  return api.post<any>('/purchase-orders', data);
}
export function approvePurchaseOrder(id: string) {
  return api.patch<any>(`/purchase-orders/${id}/approve`, {});
}
export function rejectPurchaseOrder(id: string, reason?: string) {
  return api.patch<any>(`/purchase-orders/${id}/reject`, { reason });
}
export function cancelPurchaseOrder(id: string, reason?: string) {
  return api.patch<any>(`/purchase-orders/${id}/cancel`, { reason });
}
export function receivePurchaseOrder(
  id: string,
  items?: { productId: string; quantity: number }[]
) {
  return api.patch<any>(`/purchase-orders/${id}/receive`, { items });
}
