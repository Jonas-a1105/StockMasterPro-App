import { useEffect, useRef } from 'react';
import type { Product } from '@types';

export function useBarcodeScanner(onScan: (product: Product) => void, products: Product[], search: string, setSearch: (s: string) => void, filteredProducts: Product[]) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const query = search.trim();
        if (!query) return;

        const exactMatch = products.find(p => p.barcode === query);
        if (exactMatch) {
          onScan(exactMatch);
          setSearch('');
          return;
        }

        if (filteredProducts.length === 1) {
          onScan(filteredProducts[0]);
          setSearch('');
        }
      }
    };

    const input = searchInputRef.current;
    if (input) {
      input.addEventListener('keydown', handler);
      return () => input.removeEventListener('keydown', handler);
    }
  }, [search, products, filteredProducts, onScan, setSearch]);

  return searchInputRef;
}
