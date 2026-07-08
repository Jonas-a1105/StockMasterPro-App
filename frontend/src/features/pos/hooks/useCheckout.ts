import { useState } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '@contexts/ToastContext';
import { processSale } from '../api/pos.api';
import { db } from '@shared/db/dexie';
import { syncOfflineSales } from '@shared/lib/sync/sync';
import type { CartItem } from '@types';

export interface LastSale {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  date: Date;
  customerName?: string;
}

export function useCheckout() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastSale, setLastSale] = useState<LastSale | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const checkout = async (
    items: CartItem[],
    paymentMethod: string,
    subtotal: number,
    tax: number,
    total: number,
    selectedCustomerId: string,
    customers: { id: string; name: string }[],
    isOnline: boolean,
  ) => {
    if (items.length === 0) return;
    setIsProcessing(true);

    const saleData: any = {
      items: items.map(item => ({ productId: item.product.id, quantity: item.quantity })),
      paymentMethod,
      taxRate: 16,
    };
    if (paymentMethod === 'credit' && selectedCustomerId) {
      saleData.customerId = selectedCustomerId;
    }

    const customerName = paymentMethod === 'credit'
      ? customers.find(c => c.id === selectedCustomerId)?.name
      : undefined;

    try {
      if (isOnline) {
        await processSale(saleData);
      } else {
        await db.offlineSales.add({
          tenantId: user!.tenantId,
          userId: user!.id,
          items: JSON.stringify(items.map(item => ({ productId: item.product.id, quantity: item.quantity }))),
          total,
          paymentMethod,
          createdAt: new Date().toISOString(),
          synced: false,
        });
      }

      setLastSale({ items: [...items], subtotal, tax, total, paymentMethod, date: new Date(), customerName });
      setShowSuccess(true);

      if (isOnline) {
        syncOfflineSales();
      }
    } catch (err: any) {
      showToast(err.message || 'Error al procesar la venta', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setShowSuccess(false);
    setLastSale(null);
  };

  return { checkout, isProcessing, lastSale, showSuccess, reset, setShowSuccess };
}
