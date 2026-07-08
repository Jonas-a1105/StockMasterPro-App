import { db } from '@shared/db/dexie';
import { api } from '@shared/lib/http/client';

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 2000;

let syncing = false;
let retryTimeout: ReturnType<typeof setTimeout> | null = null;

function exponentialBackoff(attempt: number): number {
  return Math.min(BASE_DELAY_MS * Math.pow(2, attempt), 60000);
}

export async function syncOfflineSales() {
  if (syncing) return;
  syncing = true;

  try {
    const pending = await db.offlineSales
      .filter(s => !s.synced && (s.retryCount || 0) < MAX_RETRIES)
      .toArray();

    if (pending.length === 0) return;

    const sales = pending.map(s => ({
      items: JSON.parse(s.items),
      paymentMethod: s.paymentMethod,
      total: s.total,
      tenantId: s.tenantId,
      userId: s.userId,
      createdAt: s.createdAt,
      idempotencyKey: s.idempotencyKey,
    }));

    await api.syncSales(sales);

    const ids = pending.map(s => s.id!).filter(Boolean);
    await db.offlineSales.bulkUpdate(
      ids.map(id => ({ key: id, changes: { synced: true, retryCount: 0 } })),
    );

    if (retryTimeout) {
      clearTimeout(retryTimeout);
      retryTimeout = null;
    }
  } catch {
    const failed = await db.offlineSales
      .filter(s => !s.synced)
      .toArray();

    for (const sale of failed) {
      const currentRetries = (sale as any).retryCount || 0;
      if (currentRetries < MAX_RETRIES) {
        await db.offlineSales.update(sale.id!, {
          retryCount: currentRetries + 1,
        });
      }
    }

    const minRetry = Math.min(
      ...failed.map(s => (s as any).retryCount || 0),
    );

    if (minRetry < MAX_RETRIES) {
      const nextDelay = exponentialBackoff(minRetry);
      retryTimeout = setTimeout(syncOfflineSales, nextDelay);
    }
  } finally {
    syncing = false;
  }
}

export function startOfflineSync() {
  const handleOnline = () => {
    syncOfflineSales();
  };

  window.addEventListener('online', handleOnline);
  syncOfflineSales();

  return () => {
    window.removeEventListener('online', handleOnline);
    if (retryTimeout) {
      clearTimeout(retryTimeout);
    }
  };
}
