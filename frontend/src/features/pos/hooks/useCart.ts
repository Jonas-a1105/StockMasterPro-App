import { useState, useMemo } from 'react';
import type { Product, CartItem } from '@types';

export function useCart() {
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
      return [...prev, { product, quantity: 1 }];
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
      return [...prev, { product, quantity: Math.min(qty, product.stock) }];
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

  const remove = (productId: string) => {
    setItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const clear = () => setItems([]);

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.product.price * item.quantity, 0), [items]);
  const tax = useMemo(() => subtotal * 0.16, [subtotal]);
  const total = useMemo(() => subtotal + tax, [subtotal, tax]);
  const totalItems = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

  return { items, add, addMultiple, updateQty, remove, clear, subtotal, tax, total, totalItems, setItems };
}
