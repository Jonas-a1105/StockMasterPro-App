import { useCallback, useRef, useState } from 'react';
import { api } from '@shared/lib/http/client';

interface GlobalSearchResult {
  type: 'product' | 'customer' | 'supplier' | 'sale' | 'purchaseOrder' | 'inventoryCount';
  id: string;
  title: string;
  subtitle: string;
  metadata?: Record<string, any>;
}

export function useGlobalSearch() {
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const search = useCallback(async (query: string, limit = 10) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    try {
      const params = new URLSearchParams({ q: query });
      if (limit !== 10) {
        params.append('limit', limit.toString());
      }
      const response = await api.get<GlobalSearchResult[]>(`/global-search?${params.toString()}`, {
        signal: controller.signal,
      });
      setResults(response);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Global search error:', err);
      }
      setResults([]);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  const debouncedSearch = useCallback((query: string, limit?: number) => {
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    const timeout = setTimeout(() => {
      search(query, limit);
    }, 300);
    debounceTimeoutRef.current = timeout;
  }, [search]);

  return { results, loading, search: debouncedSearch };
}

export type { GlobalSearchResult };