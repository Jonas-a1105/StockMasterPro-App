import { api } from '@shared/lib/http/client';

export function getSuppliers() { return api.get<any[]>('/suppliers'); }
export function createSupplier(data: any) { return api.post<any>('/suppliers', data); }
export function updateSupplier(id: string, data: any) { return api.patch<any>(`/suppliers/${id}`, data); }
export function deleteSupplier(id: string) { return api.delete<void>(`/suppliers/${id}`); }
