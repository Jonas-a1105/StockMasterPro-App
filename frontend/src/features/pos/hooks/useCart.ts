import { useState, useMemo, useContext } from 'react';
import { useExchangeRate } from '@contexts/ExchangeRateContext';
import type { Product, CartItem } from '@types';

export function useCart() {
  const { config } = useExchangeRate();
  const [items, setItems] = useState<CartItem[]>([]);

  const add = (product: Product) => {
    setItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) }
            : item
        );
      }
      return [...prev, { product, quantity: 1, discount: 0, taxRate: config.taxRate }];
    });
  };

  const addMultiple = (product: Product, qty: number) => {
    if (qty <= 0) return;
    setItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + qty, product.stock) }
            : item
        );
      }
      return [...prev, { product, quantity: Math.min(qty, product.stock), discount: 0, taxRate: config.taxRate }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setItems(prev =>
      prev.map(item => {
        if (item.product.id !== productId) return item;
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        return { ...item, quantity: Math.min(newQty, item.product.stock) };
      }).filter(Boolean) as CartItem[]
    );
  };

  const setItemDiscount = (productId: string, discount: number) => {
    setItems(prev =>
      prev.map(item =>
        item.product.id === productId
          ? { ...item, discount: Math.max(0, Math.min(100, discount)) }
          : item
      )
    );
  };

  const setItemTaxRate = (productId: string, taxRate: number) => {
    setItems(prev =>
      prev.map(item =>
        item.product.id === productId
          ? { ...item, taxRate: Math.max(0, Math.min(100, taxRate)) }
          : item
      )
    );
  };

  const remove = (productId: string) => {
    setItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const clear = () => setItems([]);

  const subtotal = useMemo(() =>
    items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [items]
  );

  const totalDiscount = useMemo(() =>
    items.reduce((sum, item) => sum + (item.product.price * item.quantity * (item.discount ?? 0) / 100), 0),
    [items]
  );

  const taxableAmount = subtotal - totalDiscount;
  const tax = useMemo(() => taxableAmount * (config.taxRate / 100), [taxableAmount]);
  const total = useMemo(() => taxableAmount + tax, [taxableAmount, tax]);
  const totalItems = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

  return {
    items,
    add,
    addMultiple,
    updateQty,
    remove,
    clear,
    setItemDiscount,
    setItemTaxRate,
    subtotal,
    totalDiscount,
    tax,
    total,
    totalItems,
    setItems,
  };
}