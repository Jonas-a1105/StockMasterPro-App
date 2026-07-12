import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queryKeys';
import {
  getInventoryProducts,
  createInventoryProduct,
  updateInventoryProduct,
  deleteInventoryProduct,
  getInventoryMovements,
  adjustStock,
  getCategories,
  createCategory,
  getWarehouses,
} from '@features/inventory/api/inventory.api';

export function useProductsQuery(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: getInventoryProducts,
  });
}

export function useProductDetailQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () =>
      getInventoryProducts().then((products) => products.find((p: any) => p.id === id)),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createInventoryProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateInventoryProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteInventoryProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
}

export function useAdjustStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adjustStock(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
}

export function useProductMovementsQuery(id: string) {
  return useQuery({
    queryKey: [...queryKeys.products.detail(id), 'movements'],
    queryFn: () => getInventoryMovements(id),
    enabled: !!id,
  });
}

export function useCategoriesQuery() {
  return useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: getCategories,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}

export function useWarehousesQuery() {
  return useQuery({
    queryKey: queryKeys.warehouses.all,
    queryFn: getWarehouses,
  });
}
