import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '@shared/db/dexie';

interface OfflineSale {
  id: string;
  items: any[];
  total: number;
  paymentMethod: string;
  customerId?: string;
  createdAt: string;
  synced: boolean;
  retryCount: number;
}

export function useOfflineQueue() {
  const [queue, setQueue] = useState<OfflineSale[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<number | null>(null);
  const processingRef = useRef(false);

  useEffect(() => {
    loadQueue();
    const handleOnline = () => syncQueue();
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  const loadQueue = useCallback(async () => {
    try {
      const pending = await db.offlineSales.where('synced').equals(false).toArray();
      setQueue(pending);
    } catch (err) {
      console.error('Failed to load offline queue:', err);
    }
  }, []);

  const addToQueue = useCallback(async (sale: Omit<OfflineSale, 'id' | 'synced' | 'retryCount'>) => {
    const offlineSale: OfflineSale = {
      ...sale,
      id: crypto.randomUUID(),
      synced: false,
      retryCount: 0,
    };
    await db.offlineSales.add(offlineSale);
    setQueue(prev => [...prev, offlineSale]);
  }, []);

  const syncQueue = useCallback(async () => {
    if (syncing || processingRef.current) return;
    
    const pending = queue.filter(s => !s.synced);
    if (pending.length === 0) return;

    processingRef.current = true;
    setSyncing(true);

    for (const sale of pending) {
      try {
        // Try to sync the sale
        await api.post('/sales', {
          items: sale.items.map(i => ({ productId: i.productId, quantity: i.quantity })),
          paymentMethod: sale.paymentMethod,
          customerId: sale.customerId,
          offlineId: sale.id,
        });
        
        await db.offlineSales.update(sale.id, { synced: true });
      } catch (err) {
        console.error('Failed to sync sale:', err);
        // Increment retry count
        const newRetryCount = sale.retryCount + 1;
        if (newRetryCount >= 5) {
          await db.offlineSales.update(sale.id, { synced: true }); // Give up after 5 retries
        } else {
          await db.offlineSales.update(sale.id, { retryCount: newRetryCount });
        }
      }
    }

    await loadQueue();
    setSyncing(false);
    setLastSync(Date.now());
    processingRef.current = false;
  }, [queue, syncing]);

  const retryFailed = useCallback(async () => {
    const failed = queue.filter(s => !s.synced && s.retryCount > 0);
    for (const sale of failed) {
      await db.offlineSales.update(sale.id, { retryCount: 0 });
    }
    await loadQueue();
    await syncQueue();
  }, [queue, syncQueue]);

  return {
    queue,
    syncing,
    lastSync,
    addToQueue,
    syncQueue,
    retryFailed,
    pendingCount: queue.filter(s => !s.synced).length,
  };
}