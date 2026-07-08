import { api } from '@shared/lib/http/client';

export function getPurchaseOrders() { return api.get<any[]>('/purchase-orders'); }
export function createPurchaseOrder(data: any) { return api.post<any>('/purchase-orders', data); }
