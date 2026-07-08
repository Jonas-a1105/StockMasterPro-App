import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queryKeys';
import { api } from '@shared/lib/http/client';

export function useSalesQuery(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.sales.list(params),
    queryFn: () => api.get<any[]>('/sales'),
  });
}

export function useSaleDetailQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.sales.detail(id),
    queryFn: () => api.get<any>(`/sales/${id}`),
    enabled: !!id,
  });
}

export function useDailySalesSummary() {
  return useQuery({
    queryKey: queryKeys.sales.dailySummary,
    queryFn: () => api.get<{ total: number; count: number }>('/sales/daily-summary'),
  });
}

export function useProcessSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post<any>('/sales', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
}
