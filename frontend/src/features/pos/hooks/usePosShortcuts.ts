import { useEffect } from 'react';
import type { PaymentMethod } from '../types';

export function usePosShortcuts({
  onCheckout,
  onClearCart,
  onPauseOrder,
  onPaymentMethodChange,
  hasItems,
  searchInputRef,
}: {
  onCheckout: () => void;
  onClearCart: () => void;
  onPauseOrder: () => void;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  hasItems: boolean;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }

      if (e.key === 'F4') {
        e.preventDefault();
        if (hasItems) onCheckout();
      }

      if (e.key === 'F7') {
        e.preventDefault();
        if (hasItems) onClearCart();
      }

      if (e.key === 'F9') {
        e.preventDefault();
        if (hasItems) onPauseOrder();
      }

      if (e.altKey && ['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        const methods: PaymentMethod[] = ['cash', 'card', 'transfer', 'credit'];
        onPaymentMethodChange(methods[parseInt(e.key) - 1]);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCheckout, onClearCart, onPauseOrder, onPaymentMethodChange, hasItems, searchInputRef]);
}
