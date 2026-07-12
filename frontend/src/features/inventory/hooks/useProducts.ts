import { useState, useEffect, useCallback } from 'react';
import { getInventoryProducts, getCategories, getWarehouses } from '../api/inventory.api';
import type { Product } from '@types';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);

  const loadProducts = useCallback(async () => {
    try {
      setProducts(await getInventoryProducts());
    } catch {
    } finally {
      setInitialLoading(false);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      setCategories(await getCategories());
    } catch {}
  }, []);

  useEffect(() => {
    loadProducts();
    loadCategories();
    getWarehouses()
      .then(setWarehouses)
      .catch(() => {});
  }, [loadProducts, loadCategories]);

  return {
    products,
    setProducts,
    categories,
    warehouses,
    initialLoading,
    loadProducts,
    loadCategories,
  };
}
