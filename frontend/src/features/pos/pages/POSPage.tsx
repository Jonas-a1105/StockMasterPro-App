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
import { CashRegisterModal } from '../components/CashRegisterModal';
import { ExpenseModal } from '../components/ExpenseModal';
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
    await checkout(cart.items, paymentMethod, cart.subtotal, cart.tax, cart.total, selectedCustomerId, customers, isOnline);
    if (paymentMethod === 'cash') {
      cash.setCashSalesTotal(cash.cashSalesTotal + cart.total);
    }
    if (isOnline) {
      if (paymentMethod === 'credit') getCustomers().then(setCustomers).catch(() => {});
    }
    cart.clear();
  }, [cart, paymentMethod, selectedCustomerId, customers, isOnline, checkout, cash, showToast]);

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
  const handleCloseCash = () => {
    const { difference } = cash.closeCash(cash.declaredAmount);
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

      {showSuccess && lastSale && <CheckoutModal lastSale={lastSale} onNewSale={() => { reset(); setSelectedCustomerId(''); setPaymentMethod('cash'); loadProducts(); }} onPrintTicket={() => {
        const ticketEl = document.getElementById('sale-ticket');
        if (!ticketEl) return;
        const printWindow = window.open('', '_blank', 'width=420,height=620');
        if (!printWindow) return;
        printWindow.document.write(`<html><head><title>Comprobante de Venta - StockMaster Pro</title><style>body{font-family:'Courier New',Courier,monospace;padding:25px;background:#f1f5f9;display:flex;flex-direction:column;align-items:center;margin:0}.actions-bar{margin-bottom:20px;display:flex;gap:10px;width:100%;max-width:340px}.btn{flex:1;padding:10px;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;text-align:center;border:none;font-family:system-ui,sans-serif}.btn-print{background:#16a34a;color:#fff}.btn-close{background:#cbd5e1;color:#333}.ticket-box{background:#fff!important;border:1px dashed #aaa!important;padding:20px;width:100%;max-width:340px;box-shadow:0 4px 12px rgba(0,0,0,0.05);border-radius:8px;box-sizing:border-box;color:#000!important}.ticket-box *{color:#000!important}@media print{.actions-bar{display:none}body{background:#fff;padding:0}.ticket-box{border:none;box-shadow:none;padding:0;max-width:100%;background:#fff}}</style></head><body><div class="actions-bar"><button class="btn btn-print" onclick="window.print()">Imprimir</button><button class="btn btn-close" onclick="window.close()">Cerrar</button></div><div class="ticket-box">${ticketEl.innerHTML}</div></body></html>`);
        printWindow.document.close();
        printWindow.focus();
      }} />}
    </>
  );
}
