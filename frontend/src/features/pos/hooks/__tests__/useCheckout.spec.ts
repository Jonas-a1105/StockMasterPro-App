import { renderHook, act } from '@testing-library/react';
import { useCheckout } from '../useCheckout';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '@contexts/ToastContext';
import { processSale } from '../../api/pos.api';
import { db } from '@shared/db/dexie';
import { syncOfflineSales } from '@shared/lib/sync/sync';
import type { CartItem, Product } from '@types';

vi.mock('@contexts/AuthContext');
vi.mock('@contexts/ToastContext');
vi.mock('../../api/pos.api');
vi.mock('@shared/db/dexie', () => ({
  db: {
    offlineSales: {
      add: vi.fn(),
    },
  },
}));
vi.mock('@shared/lib/sync/sync');

const mockUser = {
  id: 'user-1',
  tenantId: 'tenant-1',
  email: 'test@test.com',
  name: 'Test User',
  role: 'admin',
};

const mockProduct: Product = {
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
};

const mockCartItem: CartItem = {
  product: mockProduct,
  quantity: 2,
};

const mockCustomers = [{ id: 'cust-1', name: 'Customer A' }];

describe('useCheckout', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
    } as any);

    vi.mocked(useToast).mockReturnValue({
      showToast: vi.fn(),
    } as any);
  });

  it('should process a sale online and return success', async () => {
    vi.mocked(processSale).mockResolvedValue({ id: 'sale-1' });
    vi.mocked(syncOfflineSales).mockResolvedValue(undefined);

    const { result } = renderHook(() => useCheckout());

    await act(async () => {
      await result.current.checkout([mockCartItem], 'cash', 200, 32, 232, '', mockCustomers, true);
    });

    expect(processSale).toHaveBeenCalledWith({
      items: [{ productId: 'prod-1', quantity: 2 }],
      paymentMethod: 'cash',
      taxRate: 16,
    });
    expect(result.current.lastSale).toBeTruthy();
    expect(result.current.lastSale!.total).toBe(232);
    expect(result.current.showSuccess).toBe(true);
    expect(result.current.isProcessing).toBe(false);
    expect(syncOfflineSales).toHaveBeenCalled();
  });

  it('should handle API error gracefully', async () => {
    vi.mocked(processSale).mockRejectedValue(new Error('Error de conexión'));

    const { result } = renderHook(() => useCheckout());
    const { showToast } = useToast();

    await act(async () => {
      await result.current.checkout([mockCartItem], 'cash', 200, 32, 232, '', mockCustomers, true);
    });

    expect(showToast).toHaveBeenCalledWith('Error de conexión', 'error');
    expect(result.current.showSuccess).toBe(false);
    expect(result.current.isProcessing).toBe(false);
  });

  it('should queue sale offline in Dexie when offline', async () => {
    const { result } = renderHook(() => useCheckout());

    await act(async () => {
      await result.current.checkout([mockCartItem], 'cash', 200, 32, 232, '', mockCustomers, false);
    });

    expect(db.offlineSales.add).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        userId: 'user-1',
        total: 232,
        paymentMethod: 'cash',
        synced: false,
        idempotencyKey: expect.any(String),
        retryCount: 0,
      })
    );
    expect(result.current.lastSale).toBeTruthy();
    expect(result.current.showSuccess).toBe(true);
    expect(processSale).not.toHaveBeenCalled();
  });

  it('should process credit sale with customer reference', async () => {
    vi.mocked(processSale).mockResolvedValue({ id: 'sale-2' });
    vi.mocked(syncOfflineSales).mockResolvedValue(undefined);

    const { result } = renderHook(() => useCheckout());

    await act(async () => {
      await result.current.checkout(
        [mockCartItem],
        'credit',
        200,
        32,
        232,
        'cust-1',
        mockCustomers,
        true
      );
    });

    expect(processSale).toHaveBeenCalledWith(
      expect.objectContaining({
        customerId: 'cust-1',
        paymentMethod: 'credit',
      })
    );
    expect(result.current.lastSale!.customerName).toBe('Customer A');
  });

  it('should not process sale with empty cart', async () => {
    const { result } = renderHook(() => useCheckout());

    await act(async () => {
      await result.current.checkout([], 'cash', 0, 0, 0, '', mockCustomers, true);
    });

    expect(processSale).not.toHaveBeenCalled();
    expect(db.offlineSales.add).not.toHaveBeenCalled();
    expect(result.current.isProcessing).toBe(false);
  });

  it('should reset state correctly', () => {
    const { result } = renderHook(() => useCheckout());

    act(() => {
      result.current.reset();
    });

    expect(result.current.showSuccess).toBe(false);
    expect(result.current.lastSale).toBeNull();
  });
});
