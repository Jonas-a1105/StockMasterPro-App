import { db } from './db';
import { api } from './api';

let syncing = false;

export async function syncOfflineSales() {
  if (syncing) return;
  syncing = true;

  try {
    const pending = await db.offlineSales.filter(s => !s.synced).toArray();

    if (pending.length === 0) return;

    const sales = pending.map(s => ({
      items: JSON.parse(s.items),
      paymentMethod: s.paymentMethod,
      total: s.total,
      tenantId: s.tenantId,
      userId: s.userId,
      createdAt: s.createdAt,
    }));

    await api.syncSales(sales);

    const ids = pending.map(s => s.id!).filter(Boolean);
    await db.offlineSales.bulkUpdate(ids.map(id => ({ key: id, changes: { synced: true } })));
  } catch {
    // Silently fail - will retry next online event
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
  };
}
