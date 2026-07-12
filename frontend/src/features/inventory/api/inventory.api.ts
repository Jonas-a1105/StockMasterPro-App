import { api } from '@shared/lib/http/client';

export function getInventoryProducts() {
  return api.get<any[]>('/inventory');
}
export function createInventoryProduct(data: any) {
  return api.post<any>('/inventory', data);
}
export function updateInventoryProduct(id: string, data: any) {
  return api.patch<any>(`/inventory/${id}`, data);
}
export function deleteInventoryProduct(id: string) {
  return api.delete<void>(`/inventory/${id}`);
}
export function getInventoryMovements(id: string) {
  return api.get<any[]>(`/inventory/${id}/movements`);
}
export function getInventoryAdjustments() {
  return api.get<any>('/inventory/adjustments');
}
export function adjustStock(id: string, data: any) {
  return api.post<any>(`/inventory/${id}/adjust`, data);
}
export function getCategories() {
  return api.get<any[]>('/categories');
}
export function createCategory(data: { name: string }) {
  return api.post<any>('/categories', data);
}
export function getWarehouses() {
  return api.get<any[]>('/warehouses');
}
