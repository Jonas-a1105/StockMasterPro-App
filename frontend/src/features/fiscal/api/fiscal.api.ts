import { api } from '@shared/lib/http/client';

export function getFiscalSequence() { return api.get<any>('/fiscal/sequence'); }
export function resetFiscalSequence(series: string, nextNumber: number) { return api.patch<any>('/fiscal/sequence', { series, nextNumber }); }
export function getWithholdings(type?: 'iva' | 'islr') { return api.get<any[]>('/fiscal/withholdings', { params: { ...(type ? { type } : {}) } }); }
export function getFiscalBooks(type: 'ventas' | 'compras', startDate?: string, endDate?: string) {
  const params: any = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  return api.get<any[]>(`/fiscal/books/${type}`, { params });
}
