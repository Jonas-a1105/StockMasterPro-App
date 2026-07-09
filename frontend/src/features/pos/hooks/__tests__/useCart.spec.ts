import { renderHook, act } from '@testing-library/react';
import { useCart } from '../useCart';
import type { Product } from '@types';

const mockProduct = (overrides?: Partial<Product>): Product => ({
  id: 'prod-1',
  tenantId: 'tenant-1',
  name: 'Test Product',
  barcode: '123',
  price: 100,
  cost: 60,
  stock: 50,
  minStock: 5,
  categoryId: null,
  description: null,
  isActive: true,
  profitMargin: 40,
  isLowStock: false,
  ...overrides,
});

describe('useCart', () => {
  it('should start with an empty cart', () => {
    const { result } = renderHook(() => useCart());
    expect(result.current.items).toEqual([]);
    expect(result.current.totalItems).toBe(0);
    expect(result.current.subtotal).toBe(0);
    expect(result.current.tax).toBe(0);
    expect(result.current.total).toBe(0);
  });

  it('should add a product to the cart', () => {
    const { result } = renderHook(() => useCart());
    const product = mockProduct();

    act(() => result.current.add(product));

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].product.id).toBe('prod-1');
    expect(result.current.items[0].quantity).toBe(1);
  });

  it('should increase quantity when adding the same product again', () => {
    const { result } = renderHook(() => useCart());
    const product = mockProduct();

    act(() => result.current.add(product));
    act(() => result.current.add(product));

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(2);
  });

  it('should add multiple products', () => {
    const { result } = renderHook(() => useCart());
    const product1 = mockProduct();
    const product2 = mockProduct({ id: 'prod-2', name: 'Product 2', price: 50 });

    act(() => result.current.add(product1));
    act(() => result.current.add(product2));

    expect(result.current.items).toHaveLength(2);
  });

  it('should not exceed stock when adding', () => {
    const { result } = renderHook(() => useCart());
    const product = mockProduct({ stock: 3 });

    act(() => result.current.add(product));
    act(() => result.current.add(product));
    act(() => result.current.add(product));
    act(() => result.current.add(product));

    expect(result.current.items[0].quantity).toBe(3);
  });

  it('should add multiple quantity with addMultiple', () => {
    const { result } = renderHook(() => useCart());
    const product = mockProduct();

    act(() => result.current.addMultiple(product, 5));

    expect(result.current.items[0].quantity).toBe(5);
  });

  it('should ignore addMultiple with qty <= 0', () => {
    const { result } = renderHook(() => useCart());
    const product = mockProduct();

    act(() => result.current.addMultiple(product, 0));

    expect(result.current.items).toHaveLength(0);
  });

  it('should update quantity with delta', () => {
    const { result } = renderHook(() => useCart());
    const product = mockProduct();

    act(() => result.current.addMultiple(product, 5));
    act(() => result.current.updateQty('prod-1', 3));

    expect(result.current.items[0].quantity).toBe(8);
  });

  it('should remove item when delta makes quantity <= 0', () => {
    const { result } = renderHook(() => useCart());
    const product = mockProduct();

    act(() => result.current.add(product));
    act(() => result.current.updateQty('prod-1', -1));

    expect(result.current.items).toHaveLength(0);
  });

  it('should remove a product by id', () => {
    const { result } = renderHook(() => useCart());
    const product = mockProduct();

    act(() => result.current.add(product));
    act(() => result.current.remove('prod-1'));

    expect(result.current.items).toHaveLength(0);
  });

  it('should clear the cart', () => {
    const { result } = renderHook(() => useCart());
    const product = mockProduct();

    act(() => result.current.add(product));
    act(() => result.current.clear());

    expect(result.current.items).toHaveLength(0);
  });

  it('should calculate subtotal correctly', () => {
    const { result } = renderHook(() => useCart());
    const product = mockProduct({ price: 100 });

    act(() => result.current.addMultiple(product, 3));

    expect(result.current.subtotal).toBe(300);
  });

  it('should calculate tax as 16% of subtotal', () => {
    const { result } = renderHook(() => useCart());
    const product = mockProduct({ price: 100 });

    act(() => result.current.addMultiple(product, 3));

    expect(result.current.tax).toBe(48);
  });

  it('should calculate total as subtotal + tax', () => {
    const { result } = renderHook(() => useCart());
    const product = mockProduct({ price: 100 });

    act(() => result.current.addMultiple(product, 3));

    expect(result.current.total).toBe(348);
  });

  it('should calculate totalItems correctly', () => {
    const { result } = renderHook(() => useCart());
    const product1 = mockProduct();
    const product2 = mockProduct({ id: 'prod-2', name: 'Product 2' });

    act(() => result.current.addMultiple(product1, 2));
    act(() => result.current.add(product2));

    expect(result.current.totalItems).toBe(3);
  });
});
