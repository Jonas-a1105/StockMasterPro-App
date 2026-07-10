import { useState, useEffect, useMemo, useCallback } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '@contexts/ToastContext';
import { useTheme } from '@contexts/ThemeContext';
import { useExchangeRate } from '@contexts/ExchangeRateContext';
import { LoadingDots } from '@shared/ui/LoadingDots';
import { SkeletonPOSLayout } from '@shared/ui/Skeleton';
import { useCart } from '../hooks/useCart';
import { useCheckout } from '../hooks/useCheckout';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import { usePosShortcuts } from '../hooks/usePosShortcuts';
import { useCashRegister } from '../hooks/useCashRegister';
import { ProductSearch } from '../components/ProductSearch';
import { ProductGrid } from '../components/ProductGrid';
import { Cart } from '../components/Cart';
import { PaymentPanel } from '../components/PaymentPanel';
import { CheckoutModal } from '../components/CheckoutModal';
import { MixedPaymentModal } from '../components/MixedPaymentModal';
import { CashRegisterModal } from '../components/CashRegisterModal';
import { ExpenseModal } from '../components/ExpenseModal';
import { printTicket } from '@shared/lib/print/ticket';
import { formatUsd } from '@shared/lib/format/currency';
import { searchProducts, getWarehouses, getCustomers } from '../api/pos.api';
import { db } from '@shared/db/dexie';
import type { Product } from '@types';
import type { PausedCart, PaymentMethod } from '../types';
import styles from './POSPage.module.css';

export function POSPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { config } = useTheme();
  const cart = useCart();
  const cash = useCashRegister();
  const { checkout, isProcessing, lastSale, showSuccess, reset, setShowSuccess } = useCheckout();

  const [initialLoading, setInitialLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [carts, setCarts] = useState<PausedCart[]>([]);
  const [showMixedPayment, setShowMixedPayment] = useState(false);
  const [mixedPaymentPending, setMixedPaymentPending] = useState<{
    items: any[]; subtotal: number; tax: number; total: number; selectedCustomerId: string; isOnline: boolean;
  } | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    Promise.all([
      loadProducts(),
      getWarehouses().then(data => { setWarehouses(data); if (data.length > 0) setSelectedWarehouse(data[0].id); }).catch(() => {}),
      getCustomers().then(setCustomers).catch(() => {}),
    ]).finally(() => setInitialLoading(false));

    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  const loadProducts = async () => {
    try {
      const data = await searchProducts();
      setProducts(data);
      await db.products.clear();
      await db.products.bulkAdd(data);
    } catch {
      const cached = await db.products.toArray();
      setProducts(cached as unknown as Product[]);
    }
  };

  const filteredProducts = useMemo(() =>
    products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search)),
    [products, search]
  );

  const selectedCustomer = useMemo(() => customers.find(c => c.id === selectedCustomerId), [customers, selectedCustomerId]);
  const creditExceeded = useMemo(() => {
    if (!selectedCustomer || paymentMethod !== 'credit') return false;
    const limit = Number(selectedCustomer.creditLimit);
    if (limit <= 0) return false;
    return Number(selectedCustomer.balance) + cart.total > limit;
  }, [selectedCustomer, paymentMethod, cart.total]);

  const pauseOrder = useCallback(() => {
    const name = prompt('Nombre para la orden pausada:');
    if (!name || cart.items.length === 0) return;
    setCarts(prev => [...prev, { id: crypto.randomUUID(), name, items: [...cart.items] }]);
    cart.clear();
  }, [cart]);

  const handleCheckout = useCallback(async () => {
    if (cart.items.length === 0) return;
    if (paymentMethod === 'credit' && !selectedCustomerId) {
      showToast('Selecciona un cliente para venta a crédito', 'error');
      return;
    }
    if (paymentMethod === 'cash' && !cash.isTodayOpen) {
      showToast('Debe abrir caja antes de cobrar en efectivo', 'error');
      cash.setShowCashModal(true);
      return;
    }
    if (paymentMethod === 'mixed') {
      setMixedPaymentPending({
        items: cart.items,
        subtotal: cart.subtotal,
        tax: cart.tax,
        total: cart.total,
        selectedCustomerId,
        isOnline,
      });
      setShowMixedPayment(true);
      return;
    }
    await checkout(cart.items, paymentMethod, cart.subtotal, cart.tax, cart.total, selectedCustomerId, customers, isOnline);
    if (paymentMethod === 'cash') {
      cash.setCashSalesTotal(cash.cashSalesTotal + cart.total);
    }
    if (isOnline) {
      if (paymentMethod === 'credit') getCustomers().then(setCustomers).catch(() => {});
    }
    cart.clear();
  }, [cart, paymentMethod, selectedCustomerId, customers, isOnline, checkout, cash, showToast]);

  const handleMixedPaymentSubmit = useCallback(async (
    payments: { paymentMethod: PaymentMethod; amount: number; exchangeRate?: number; reference?: string }[]
  ) => {
    const pending = mixedPaymentPending;
    if (!pending) return;

    const hasCash = payments.some(p => p.paymentMethod === 'cash');
    if (hasCash && !cash.isTodayOpen) {
      showToast('Debe abrir caja antes de cobrar en efectivo', 'error');
      cash.setShowCashModal(true);
      return;
    }

    // Validate total matches
    const paymentsTotal = payments.reduce((sum, p) => sum + p.amount, 0);
    if (Math.abs(paymentsTotal - pending.total) > 0.01) {
      showToast('La suma de los pagos no coincide con el total', 'error');
      return;
    }

    await checkout(pending.items, 'mixed', pending.subtotal, pending.tax, pending.total, pending.selectedCustomerId, customers, pending.isOnline, payments);
    
    if (payments.some(p => p.paymentMethod === 'cash')) {
      const cashAmount = payments.filter(p => p.paymentMethod === 'cash').reduce((sum, p) => sum + p.amount, 0);
      cash.setCashSalesTotal(cash.cashSalesTotal + cashAmount);
    }
    if (pending.isOnline && payments.some(p => p.paymentMethod === 'credit')) {
      getCustomers().then(setCustomers).catch(() => {});
    }

    setShowMixedPayment(false);
    setMixedPaymentPending(null);
    cart.clear();
  }, [mixedPaymentPending, checkout, customers, cash, showToast, isOnline]);

  const searchInputRef = useBarcodeScanner(cart.add, products, search, setSearch, filteredProducts);

  usePosShortcuts({
    onCheckout: handleCheckout,
    onClearCart: () => { cart.clear(); showToast('Carrito limpiado', 'info'); },
    onPauseOrder: pauseOrder,
    onPaymentMethodChange: (m) => { setPaymentMethod(m); showToast(`Método de pago: ${m}`, 'info'); },
    hasItems: cart.items.length > 0,
    searchInputRef,
  });

  if (initialLoading) return config.skeletonEnabled ? <SkeletonPOSLayout /> : <LoadingDots text="Cargando POS..." />;

  const handleOpenCash = () => cash.openCash(cash.cashOpening);
  const handleCloseCash = async () => {
    const { difference } = await cash.closeCash(cash.declaredAmount);
    if (difference !== 0) {
      showToast(
        `Diferencia en caja: ${difference > 0 ? 'Sobrante' : 'Faltante'} de ${formatUsd(Math.abs(difference))}`,
        difference > 0 ? 'warning' : 'error',
      );
    }
  };

  return (
    <>
      {cartOpen && <div className={styles.cartOverlay} onClick={() => setCartOpen(false)} />}
      <div className={styles.posContainer}>
        <section className={styles.productsPanel}>
          <ProductSearch searchInputRef={searchInputRef as any} search={search} onSearchChange={setSearch} />
          {warehouses.length > 1 && (
            <div className={styles.warehouseSelector}>
              <label>Almacén:</label>
              <select value={selectedWarehouse} onChange={e => setSelectedWarehouse(e.target.value)}>
                {warehouses.filter((w: any) => w.isActive).map((w: any) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          )}
          <ProductGrid products={filteredProducts} onAdd={cart.add} cartItems={cart.items} />
        </section>
        <aside className={`${styles.cartPanel} ${cartOpen ? styles.cartPanelOpen : ''}`}>
          <div className={styles.cartHandle} onClick={() => setCartOpen(false)} />
          <Cart
            items={cart.items} onUpdateQty={cart.updateQty} onRemove={cart.remove}
            totalItems={cart.totalItems} isOnline={isOnline}
            onPauseOrder={pauseOrder} onOpenCash={() => cash.setShowCashModal(true)} onOpenExpense={() => cash.setShowExpenseModal(true)}
            carts={carts}
            onResumeOrder={(pc) => { cart.setItems(pc.items); setCarts(prev => prev.filter(c => c.id !== pc.id)); }}
            onDiscardCart={(id) => setCarts(prev => prev.filter(c => c.id !== id))}
          />
          <PaymentPanel
            subtotal={cart.subtotal} tax={cart.tax} total={cart.total}
            paymentMethod={paymentMethod} onPaymentMethodChange={setPaymentMethod}
            onCheckout={handleCheckout} loading={isProcessing} cartEmpty={cart.items.length === 0}
            customers={customers} selectedCustomerId={selectedCustomerId} onCustomerChange={setSelectedCustomerId}
            creditExceeded={creditExceeded} selectedCustomer={selectedCustomer}
          />
        </aside>
      </div>

      <div className={styles.cartFabContainer} data-hidden={cart.totalItems === 0}>
        <button className={styles.cartFab} onClick={() => setCartOpen(true)}>
          <ShoppingCart size={20} />
        </button>
        {cart.totalItems > 0 && <span className={styles.cartFabBadge}>{cart.totalItems}</span>}
      </div>

      <CashRegisterModal
        show={cash.showCashModal} isTodayOpen={cash.isTodayOpen}
        cashOpening={cash.cashOpening} cashSalesTotal={cash.cashSalesTotal} declaredAmount={cash.declaredAmount}
        onCashOpeningChange={cash.setCashOpening} onDeclaredAmountChange={cash.setDeclaredAmount}
        onOpenCash={handleOpenCash}
        onCloseCash={handleCloseCash}
        onClose={() => { cash.setShowCashModal(false); cash.setDeclaredAmount(0); cash.setCashOpening(0); }}
      />

      <ExpenseModal
        show={cash.showExpenseModal}
        onClose={() => cash.setShowExpenseModal(false)}
      />

      <MixedPaymentModal
        open={showMixedPayment}
        onClose={() => { setShowMixedPayment(false); setMixedPaymentPending(null); }}
        onSubmit={handleMixedPaymentSubmit}
        total={mixedPaymentPending?.total || 0}
        loading={isProcessing}
        paymentMethod="mixed"
      />

      {showSuccess && lastSale && <CheckoutModal lastSale={lastSale} onNewSale={() => { reset(); setSelectedCustomerId(''); setPaymentMethod('cash'); loadProducts(); }} onPrintTicket={() => printTicket({
        id: 'POS-' + Date.now(),
        createdAt: lastSale.date,
        total: lastSale.total,
        paymentMethod: lastSale.paymentMethod,
        items: lastSale.items.map(i => ({
          product: { name: i.product.name },
          quantity: i.quantity,
          price: i.product.price,
          subtotal: i.product.price * i.quantity,
        })),
        customer: lastSale.customerName ? { name: lastSale.customerName } : undefined,
        discount: lastSale.subtotal + lastSale.tax - lastSale.total > 0 ? lastSale.subtotal + lastSale.tax - lastSale.total : undefined,
      })} />}
    </>
  );
}
