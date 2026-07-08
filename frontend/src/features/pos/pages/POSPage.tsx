import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { api } from '@shared/lib/http/client';
import { db } from '@shared/db/dexie';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '@contexts/ToastContext';
import { useTheme } from '@contexts/ThemeContext';
import { LoadingDots } from '@shared/ui/LoadingDots';
import { SkeletonPOSLayout } from '@shared/ui/Skeleton';
import { ButtonLoader } from '@shared/ui/ButtonLoader';
import { syncOfflineSales } from '@shared/lib/sync/sync';
import {
  Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, DollarSign,
  Ban, PauseCircle, PlayCircle, X, Wallet, Receipt, Users, Printer,
  Package, AlertTriangle,
} from 'lucide-react';
import type { Product, CartItem, Customer } from '@types';
import { useExchangeRate } from '@contexts/ExchangeRateContext';
import styles from './POSPage.module.css';

export function POSPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { formatPrice, formatUsd, formatBs } = useExchangeRate();
  const { config } = useTheme();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer' | 'credit'>('cash');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');

  // Credit payment
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  // Mobile cart bottom sheet
  const [cartOpen, setCartOpen] = useState(false);

  // Success modal
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastSale, setLastSale] = useState<{ items: CartItem[]; subtotal: number; tax: number; total: number; paymentMethod: string; date: Date; customerName?: string } | null>(null);

  // Multiple carts
  const [carts, setCarts] = useState<{ id: string; name: string; items: CartItem[] }[]>([]);

  // Cash register
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashOpening, setCashOpening] = useState(0);
  const [cashOpeningDate, setCashOpeningDate] = useState<string | null>(null);
  const [cashClosings, setCashClosings] = useState<
    { opening: number; sales: number; expected: number; declared: number; difference: number; date: string }[]
  >([]);
  const [cashSalesTotal, setCashSalesTotal] = useState(0);
  const [declaredAmount, setDeclaredAmount] = useState(0);

  // Expenses
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState(0);
  const [expenseReason, setExpenseReason] = useState('');

  const isTodayOpen =
    cashOpeningDate && new Date(cashOpeningDate).toDateString() === new Date().toDateString();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    Promise.all([
      loadProducts(),
      api.get('/warehouses').then((data) => {
        setWarehouses(data);
        if (data.length > 0) setSelectedWarehouse(data[0].id);
      }).catch(() => {}),
      api.getCustomers().then(setCustomers).catch(() => {}),
    ]).finally(() => setInitialLoading(false));

    const savedClosings = localStorage.getItem('stockmaster-cash');
    if (savedClosings) setCashClosings(JSON.parse(savedClosings));

    const savedOpening = localStorage.getItem('stockmaster-cash-opening');
    if (savedOpening) {
      const data = JSON.parse(savedOpening);
      if (new Date(data.date).toDateString() === new Date().toDateString()) {
        setCashOpening(data.amount);
        setCashOpeningDate(data.date);
      }
    }

    const savedCashSales = localStorage.getItem('stockmaster-cash-sales');
    if (savedCashSales) setCashSalesTotal(parseFloat(savedCashSales));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);



  const loadProducts = async () => {
    try {
      const data = await api.getProducts();
      setProducts(data);
      await db.products.clear();
      await db.products.bulkAdd(data);
    } catch {
      const cached = await db.products.toArray();
      setProducts(cached as unknown as Product[]);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode?.includes(search)
  );

  const addToCart = (product: Product) => {
    setCart(prev => {
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

  const addMultipleToCart = (product: Product, qty: number) => {
    if (qty <= 0) return;
    setCart(prev => {
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

  const updateCardQty = (productId: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[productId] || 1;
      const next = current + delta;
      if (next < 1) return prev;
      return { ...prev, [productId]: next };
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev =>
      prev.map(item => {
        if (item.product.id !== productId) return item;
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        return { ...item, quantity: Math.min(newQty, item.product.stock) };
      }).filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const tax = subtotal * 0.16;
  const total = subtotal + tax;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const selectedCustomer = useMemo(
    () => customers.find(c => c.id === selectedCustomerId),
    [customers, selectedCustomerId]
  );
  const creditExceeded = useMemo(() => {
    if (!selectedCustomer || paymentMethod !== 'credit') return false;
    const limit = Number(selectedCustomer.creditLimit);
    if (limit <= 0) return false;
    return Number(selectedCustomer.balance) + total > limit;
  }, [selectedCustomer, paymentMethod, total]);

  // Multiple carts
  const pauseOrder = () => {
    const name = prompt('Nombre para la orden pausada:');
    if (!name || cart.length === 0) return;
    setCarts(prev => [...prev, { id: crypto.randomUUID(), name, items: [...cart] }]);
    setCart([]);
  };

  const resumeOrder = (pausedCart: { id: string; name: string; items: CartItem[] }) => {
    if (cart.length > 0) {
      if (!confirm('El carrito actual se perderá. ¿Continuar?')) return;
    }
    setCart(pausedCart.items);
    setCarts(prev => prev.filter(c => c.id !== pausedCart.id));
  };

  const discardCart = (cartId: string) => {
    setCarts(prev => prev.filter(c => c.id !== cartId));
  };

  // Cash register
  const handleOpenCashRegister = () => {
    if (cashOpening <= 0) return;
    const data = { amount: cashOpening, date: new Date().toISOString() };
    localStorage.setItem('stockmaster-cash-opening', JSON.stringify(data));
    setCashOpeningDate(data.date);
    setCashSalesTotal(0);
    localStorage.setItem('stockmaster-cash-sales', '0');
    setShowCashModal(false);
  };

  const handleCashClose = () => {
    const expected = cashOpening + cashSalesTotal;
    const diff = declaredAmount - expected;
    const close = {
      opening: cashOpening,
      sales: cashSalesTotal,
      expected,
      declared: declaredAmount,
      difference: diff,
      date: new Date().toISOString(),
    };
    const updated = [...cashClosings, close];
    setCashClosings(updated);
    localStorage.setItem('stockmaster-cash', JSON.stringify(updated));
    localStorage.removeItem('stockmaster-cash-opening');
    setCashOpening(0);
    setCashOpeningDate(null);
    setDeclaredAmount(0);
    setShowCashModal(false);
    if (diff !== 0) {
      showToast(
        `Diferencia en caja: ${diff > 0 ? 'Sobrante' : 'Faltante'} de $${Math.abs(diff).toFixed(2)}`,
        diff > 0 ? 'warning' : 'error'
      );
    }
  };

  // Expenses
  const handleExpense = () => {
    if (expenseAmount <= 0 || !expenseReason.trim()) return;
    const expenses = JSON.parse(localStorage.getItem('stockmaster-expenses') || '[]');
    expenses.push({ amount: expenseAmount, reason: expenseReason, date: new Date().toISOString() });
    localStorage.setItem('stockmaster-expenses', JSON.stringify(expenses));
    setShowExpenseModal(false);
    setExpenseAmount(0);
    setExpenseReason('');
  };

  // Checkout
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'credit' && !selectedCustomerId) {
      showToast('Selecciona un cliente para venta a crédito', 'error');
      return;
    }
    setLoading(true);

    const saleData: any = {
      items: cart.map(item => ({ productId: item.product.id, quantity: item.quantity })),
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
        await api.processSale(saleData);
      } else {
        await db.offlineSales.add({
          tenantId: user!.tenantId,
          userId: user!.id,
          items: JSON.stringify(cart.map(item => ({ productId: item.product.id, quantity: item.quantity }))),
          total,
          paymentMethod,
          createdAt: new Date().toISOString(),
          synced: false,
        });
      }

      // Store sale data for success modal
      setLastSale({
        items: [...cart],
        subtotal,
        tax,
        total,
        paymentMethod,
        date: new Date(),
        customerName,
      });

      if (paymentMethod === 'cash') {
        const newTotal = cashSalesTotal + total;
        setCashSalesTotal(newTotal);
        localStorage.setItem('stockmaster-cash-sales', String(newTotal));
      }

      setCart([]);
      setShowSuccess(true);

      if (isOnline) {
        syncOfflineSales();
        // Reload customers to get updated balances
        if (paymentMethod === 'credit') {
          api.getCustomers().then(setCustomers).catch(() => {});
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Error al procesar la venta', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleNewSale = () => {
    setShowSuccess(false);
    setLastSale(null);
    setSelectedCustomerId('');
    setPaymentMethod('cash');
    loadProducts();
  };

  const handlePrintTicket = () => {
    const ticketEl = document.getElementById('sale-ticket');
    if (!ticketEl) return;
    const printWindow = window.open('', '_blank', 'width=420,height=620');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Comprobante de Venta - StockMaster Pro</title>
          <style>
            body {
              font-family: 'Courier New', Courier, monospace;
              padding: 25px;
              background-color: #f1f5f9;
              display: flex;
              flex-direction: column;
              align-items: center;
              margin: 0;
            }
            .actions-bar {
              margin-bottom: 20px;
              display: flex;
              gap: 10px;
              width: 100%;
              max-width: 340px;
            }
            .btn {
              flex: 1;
              padding: 10px;
              border-radius: 6px;
              font-size: 13px;
              font-weight: 600;
              cursor: pointer;
              text-align: center;
              border: none;
              font-family: system-ui, -apple-system, sans-serif;
              transition: opacity 0.15s ease;
            }
            .btn:hover {
              opacity: 0.9;
            }
            .btn-print {
              background-color: #16a34a;
              color: white;
            }
            .btn-close {
              background-color: #cbd5e1;
              color: #333333;
            }
            .ticket-box {
              background: #ffffff !important;
              border: 1px dashed #aaaaaa !important;
              padding: 20px;
              width: 100%;
              max-width: 340px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.05);
              border-radius: 8px;
              box-sizing: border-box;
              color: #000000 !important;
            }
            .ticket-box * {
              font-family: 'Courier New', Courier, monospace !important;
              color: #000000 !important;
            }
            
            /* CSS Modules Class Substring Selectors to restore POS receipt layout */
            .ticket-box [class*="ticketHeader"] {
              text-align: center !important;
              margin-bottom: 15px !important;
            }
            .ticket-box [class*="ticketBrand"] {
              font-size: 16px !important;
              font-weight: bold !important;
              letter-spacing: 1px !important;
              color: #000000 !important;
              margin-bottom: 4px !important;
            }
            .ticket-box [class*="ticketSubtitle"] {
              font-size: 11px !important;
              color: #555555 !important;
            }
            .ticket-box [class*="ticketDivider"] {
              border-top: 1px dashed #999999 !important;
              border-bottom: none !important;
              border-left: none !important;
              border-right: none !important;
              margin: 12px 0 !important;
              height: 0 !important;
            }
            .ticket-box [class*="ticketDetails"] {
              font-size: 12px !important;
              margin-bottom: 12px !important;
              line-height: 1.4 !important;
              text-align: left !important;
            }
            .ticket-box [class*="ticketDetails"] div {
              text-align: left !important;
            }
            .ticket-box [class*="ticketItem"] {
              display: flex !important;
              justify-content: space-between !important;
              align-items: flex-start !important;
              font-size: 12px !important;
              margin-bottom: 6px !important;
            }
            .ticket-box [class*="ticketItemInfo"] {
              display: flex !important;
              flex-direction: column !important;
              text-align: left !important;
            }
            .ticket-box [class*="ticketItemQtyPrice"] {
              font-size: 11px !important;
              color: #555555 !important;
              text-align: left !important;
            }
            .ticket-box [class*="ticketTotalRow"] {
              display: flex !important;
              justify-content: space-between !important;
              font-size: 12px !important;
              margin-bottom: 4px !important;
            }
            .ticket-box [class*="ticketGrandTotal"] {
              font-weight: bold !important;
              font-size: 14px !important;
              border-top: 1px dashed #777777 !important;
              padding-top: 6px !important;
              margin-top: 6px !important;
            }
            .ticket-box [class*="ticketFooter"] {
              text-align: center !important;
              font-size: 11px !important;
              color: #555555 !important;
              margin-top: 15px !important;
            }
            
            @media print {
              .actions-bar { display: none; }
              body { background-color: #ffffff; padding: 0; }
              .ticket-box { border: none; box-shadow: none; padding: 0; max-width: 100%; background: #ffffff; }
              .ticket-box * { color: #000000 !important; }
              .ticket-box [class*="ticketDivider"] { border-top: 1px dashed #000000 !important; }
            }
          </style>
        </head>
        <body>
          <div class="actions-bar">
            <button class="btn btn-print" onclick="window.print()">Imprimir</button>
            <button class="btn btn-close" onclick="window.close()">Cerrar</button>
          </div>
          <div class="ticket-box">
            ${ticketEl.innerHTML}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
  };

  const paymentLabel = (method: string) => {
    switch (method) {
      case 'cash': return 'Efectivo';
      case 'card': return 'Tarjeta';
      case 'transfer': return 'Transferencia';
      case 'credit': return 'Crédito';
      default: return method;
    }
  };

  // Keyboard Shortcuts for POS operations
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Focus Search Bar: F2
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }

      // Checkout (Cerrar venta): F4
      if (e.key === 'F4') {
        e.preventDefault();
        if (cart.length > 0) {
          handleCheckout();
        } else {
          showToast('El carrito está vacío', 'warning');
        }
      }

      // Clear Cart (Limpiar carrito): F7
      if (e.key === 'F7') {
        e.preventDefault();
        if (cart.length > 0) {
          if (window.confirm('¿Está seguro de que desea limpiar el carrito?')) {
            setCart([]);
            showToast('Carrito limpiado', 'info');
          }
        }
      }

      // Pause Order (Pausar venta): F9
      if (e.key === 'F9') {
        e.preventDefault();
        if (cart.length > 0) {
          pauseOrder();
        }
      }

      // Change payment method: Alt + 1, Alt + 2, Alt + 3, Alt + 4
      if (e.altKey && ['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        const methods: ('cash' | 'card' | 'transfer' | 'credit')[] = ['cash', 'card', 'transfer', 'credit'];
        const selected = methods[parseInt(e.key) - 1];
        setPaymentMethod(selected);
        showToast(`Método de pago: ${selected === 'cash' ? 'Efectivo' : selected === 'card' ? 'Tarjeta' : selected === 'transfer' ? 'Transferencia' : 'Crédito'}`, 'info');
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [cart, paymentMethod, search, products, filteredProducts, selectedCustomerId]);

  if (initialLoading) return config.skeletonEnabled ? <SkeletonPOSLayout /> : <LoadingDots text="Cargando POS..." />;

  return (
    <>
      {cartOpen && <div className={styles.cartOverlay} onClick={() => setCartOpen(false)} />}
      <div className={styles.posContainer}>
        <div className={styles.productsPanel}>
          <div className={styles.searchBar}>
            <Search size={18} />
            <input
              type="text"
              ref={searchInputRef}
              className={styles.searchInput}
              placeholder="Buscar producto por nombre o código de barras..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const query = search.trim();
                  if (!query) return;

                  // 1. Try exact barcode match first
                  const exactMatch = products.find(p => p.barcode === query);
                  if (exactMatch) {
                    addToCart(exactMatch);
                    setSearch('');
                    showToast(`Producto agregado: ${exactMatch.name}`, 'success');
                    return;
                  }

                  // 2. If single filtered product, add it
                  if (filteredProducts.length === 1) {
                    addToCart(filteredProducts[0]);
                    setSearch('');
                    showToast(`Producto agregado: ${filteredProducts[0].name}`, 'success');
                    return;
                  }
                }
              }}
              autoFocus
            />
          </div>

          {warehouses.length > 1 && (
            <div className={styles.warehouseSelector}>
              <label>Almacén:</label>
              <select value={selectedWarehouse} onChange={e => setSelectedWarehouse(e.target.value)}>
                {warehouses.filter(w => w.isActive).map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className={styles.productsGrid}>
            {filteredProducts.map(product => {
              const isBajo = (product as any).minStock > 0 && product.stock <= (product as any).minStock;
              const cartItem = cart.find(item => item.product.id === product.id);
              const addedQty = cartItem ? cartItem.quantity : 0;
              const availableStock = product.stock - addedQty;
              const isLocked = product.stock === 0 || availableStock <= 0;

              return (
                <div key={product.id} className={`${styles.productCard} ${isLocked ? styles.prodOutOfStock : ''}`}>
                  <div className={styles.prodImageContainer} onClick={() => { if (!isLocked) { addToCart(product); if (cart.length === 0) setCartOpen(true); } }}>
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt="" />
                    ) : (
                      <Package size={28} style={{ color: 'var(--text-muted)' }} />
                    )}
                    {addedQty > 0 && (
                      <div className={styles.prodCartCountBadge}>
                        {addedQty}
                      </div>
                    )}
                    {product.stock === 0 ? (
                      <div className={`${styles.prodBadge} ${styles.prodBadgeOut}`}>
                        Agotado
                      </div>
                    ) : availableStock === 0 ? (
                      <div className={`${styles.prodBadge} ${styles.prodBadgeOut}`}>
                        Sin stock
                      </div>
                    ) : null}
                  </div>

                  <div className={styles.prodInfoGrid}>
                    <div className={styles.prodPriceUsd}>{formatUsd(product.price)}</div>
                    <div className={styles.prodUnitsStock}>{product.stock} ud.</div>
                    <div className={styles.prodProductName}>{product.name}</div>
                  </div>

                  <div className={styles.prodBottomCapsule}>
                    <div className={styles.prodPriceBsRow}>
                      <span className={styles.prodPriceBsLabel}>Ref. Bs</span>
                      <span className={styles.prodPriceBsValue}>{formatBs(product.price)}</span>
                    </div>

                    <div className={styles.prodActionsRow}>
                      <button className={styles.prodAddBtn} onClick={() => { addToCart(product); if (cart.length === 0) setCartOpen(true); }} disabled={isLocked}>
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 0a2 2 0 100 4 2 2 0 000-4z"/>
                        </svg>
                        Agregar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredProducts.length === 0 && (
              <p className={styles.noResults}>No se encontraron productos</p>
            )}
          </div>
        </div>

        <div className={`${styles.cartPanel} ${cartOpen ? styles.cartPanelOpen : ''}`}>
          <div className={styles.cartHandle} onClick={() => setCartOpen(false)} />
          <div className={styles.cartTabs}>
            <button className={`${styles.cartTab} ${styles.cartTabActive}`}>
              <ShoppingCart size={14} />
              Carrito Actual
            </button>
            {carts.map(pc => (
              <div key={pc.id} className={styles.cartTab}>
                <button className={styles.cartTabBtn} onClick={() => resumeOrder(pc)}>
                  <PlayCircle size={14} />
                  {pc.name}
                </button>
                <button className={styles.cartTabClose} onClick={() => discardCart(pc.id)}>
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>

          <div className={styles.cartHeader}>
            <ShoppingCart size={18} />
            <span>Carrito ({cart.length})</span>
            <span className={`${styles.status} ${isOnline ? styles.online : styles.offline}`}>
              {isOnline ? 'En línea' : 'Offline'}
            </span>
          </div>

          <div className={styles.toolbarRow}>
            {cart.length > 0 && (
              <button className={styles.toolbarBtn} onClick={pauseOrder}>
                <PauseCircle size={14} /> Pausar Orden
              </button>
            )}
            <button className={styles.toolbarBtn} onClick={() => setShowCashModal(true)}>
              <Wallet size={14} /> {isTodayOpen ? 'Cierre Caja' : 'Apertura Caja'}
            </button>
            <button className={styles.toolbarBtn} onClick={() => setShowExpenseModal(true)}>
              <Receipt size={14} /> Gasto
            </button>
          </div>

          <div className={styles.cartItems}>
            {cart.map(item => (
              <div key={item.product.id} className={styles.cartItem}>
                <div className={styles.cartItemInfo}>
                  <div className={styles.cartItemName}>{item.product.name}</div>
                  <div className={styles.cartItemPrice}>{formatPrice(item.product.price, { showUsd: true })}</div>
                </div>
                <div className={styles.cartItemActions}>
                  <button onClick={() => updateQuantity(item.product.id, -1)}><Minus size={14} /></button>
                  <span className={styles.qty}>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product.id, 1)}><Plus size={14} /></button>
                  <button className={styles.deleteBtn} onClick={() => removeFromCart(item.product.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className={styles.cartItemTotal}>
                  {formatPrice(item.product.price * item.quantity)}
                </div>
              </div>
            ))}
            {cart.length === 0 && (
              <p className={styles.emptyCart}>Selecciona productos para agregar al carrito</p>
            )}
          </div>

          <div className={styles.cartSummary}>
            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <span>{formatPrice(subtotal, { showUsd: true })}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>IVA (16%)</span>
              <span>{formatPrice(tax, { showUsd: true })}</span>
            </div>
            <div className={`${styles.summaryRow} ${styles.totalRow}`}>
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>

          <div className={styles.paymentMethods}>
            <button
              className={`${styles.paymentBtn} ${paymentMethod === 'cash' ? styles.active : ''}`}
              onClick={() => setPaymentMethod('cash')}
            >
              <DollarSign size={16} /> Efectivo
            </button>
            <button
              className={`${styles.paymentBtn} ${paymentMethod === 'card' ? styles.active : ''}`}
              onClick={() => setPaymentMethod('card')}
            >
              <CreditCard size={16} /> Tarjeta
            </button>
            <button
              className={`${styles.paymentBtn} ${paymentMethod === 'transfer' ? styles.active : ''}`}
              onClick={() => setPaymentMethod('transfer')}
            >
              <Ban size={16} /> Transferencia
            </button>
            <button
              className={`${styles.paymentBtn} ${paymentMethod === 'credit' ? styles.active : ''}`}
              onClick={() => setPaymentMethod('credit')}
            >
              <Users size={16} /> Crédito
            </button>
          </div>

          {paymentMethod === 'credit' && (
            <div className={styles.customerSelectContainer}>
              <label className={styles.customerLabel}>Seleccionar Cliente</label>
              <select
                className={styles.customerSelect}
                value={selectedCustomerId}
                onChange={e => setSelectedCustomerId(e.target.value)}
              >
                <option value="">-- Seleccionar --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} — Saldo: ${Number(c.balance).toFixed(2)} / Límite: ${Number(c.creditLimit).toFixed(2)}
                  </option>
                ))}
              </select>
              {creditExceeded && selectedCustomer && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '8px 10px', backgroundColor: 'rgba(220,38,38,0.1)', borderLeft: '3px solid #dc2626', fontSize: 12, color: '#ef4444' }}>
                  <AlertTriangle size={14} />
                  <span>Límite de crédito excedido. Saldo actual: ${Number(selectedCustomer.balance).toFixed(2)} + Total: ${total.toFixed(2)} &gt; Límite: ${Number(selectedCustomer.creditLimit).toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          <button
            className={styles.checkoutBtn}
            onClick={handleCheckout}
            disabled={cart.length === 0 || loading || (paymentMethod === 'credit' && !selectedCustomerId) || creditExceeded}
          >
            {loading ? <ButtonLoader /> : <>Cobrar</>}
          </button>
        </div>
      </div>

      <div className={styles.cartFabContainer} data-hidden={totalItems === 0}>
        <button
          className={styles.cartFab}
          onClick={() => setCartOpen(true)}
        >
          <ShoppingCart size={20} />
        </button>
        {totalItems > 0 && <span className={styles.cartFabBadge}>{totalItems}</span>}
      </div>

      {showCashModal && createPortal(
        <div className={styles.modalOverlay} onClick={() => { setShowCashModal(false); setDeclaredAmount(0); }}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div className={styles.modalTitle}>
              <Wallet size={18} />
              {isTodayOpen ? 'Cierre de Caja' : 'Apertura de Caja'}
            </div>
            {!isTodayOpen ? (
              <>
                <div className={styles.modalBody}>
                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>Monto de apertura (base)</label>
                    <input
                      type="number"
                      className={styles.modalInput}
                      value={cashOpening || ''}
                      onChange={e => setCashOpening(parseFloat(e.target.value) || 0)}
                      min={0}
                      step={0.01}
                      autoFocus
                    />
                  </div>
                </div>
                <div className={styles.modalActions}>
                  <button className={styles.modalBtnSecondary} onClick={() => { setShowCashModal(false); setCashOpening(0); }}>Cancelar</button>
                  <button className={styles.modalBtnPrimary} onClick={handleOpenCashRegister} disabled={cashOpening <= 0}>Abrir Caja</button>
                </div>
              </>
            ) : (
              <>
                <div className={styles.modalBody}>
                  <div className={styles.modalRow}>
                    <span>Apertura</span>
                    <span className={styles.modalValue}>{formatPrice(cashOpening)}</span>
                  </div>
                  <div className={styles.modalRow}>
                    <span>Ventas del día (efectivo)</span>
                    <span className={styles.modalValue}>{formatPrice(cashSalesTotal)}</span>
                  </div>
                  <div className={styles.modalRow}>
                    <span>Esperado</span>
                    <span className={styles.modalValue}>{formatPrice(cashOpening + cashSalesTotal)}</span>
                  </div>
                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>Dinero contado</label>
                    <input
                      type="number"
                      className={styles.modalInput}
                      value={declaredAmount || ''}
                      onChange={e => setDeclaredAmount(parseFloat(e.target.value) || 0)}
                      min={0}
                      step={0.01}
                      autoFocus
                    />
                  </div>
                  {declaredAmount > 0 && (
                    <div className={`${styles.modalRow} ${styles.modalRowDiff}`}>
                      <span>Diferencia</span>
                      <span className={`${styles.modalValue} ${declaredAmount >= cashOpening + cashSalesTotal ? styles.modalPositive : styles.modalNegative}`}>
                        {formatPrice(declaredAmount - (cashOpening + cashSalesTotal))}
                      </span>
                    </div>
                  )}
                </div>
                <div className={styles.modalActions}>
                  <button className={styles.modalBtnSecondary} onClick={() => { setShowCashModal(false); setDeclaredAmount(0); }}>Cancelar</button>
                  <button className={styles.modalBtnPrimary} onClick={handleCashClose}>Cerrar Caja</button>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}

      {showExpenseModal && createPortal(
        <div className={styles.modalOverlay} onClick={() => { setShowExpenseModal(false); setExpenseAmount(0); setExpenseReason(''); }}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div className={styles.modalTitle}>
              <Receipt size={18} /> Registrar Gasto
            </div>
            <div className={styles.modalBody}>
              <div className={styles.modalField}>
                <label className={styles.modalLabel}>Monto</label>
                <input
                  type="number"
                  className={styles.modalInput}
                  value={expenseAmount || ''}
                  onChange={e => setExpenseAmount(parseFloat(e.target.value) || 0)}
                  min={0}
                  step={0.01}
                  autoFocus
                />
              </div>
              <div className={styles.modalField}>
                <label className={styles.modalLabel}>Motivo</label>
                <input
                  type="text"
                  className={styles.modalInput}
                  value={expenseReason}
                  onChange={e => setExpenseReason(e.target.value)}
                  placeholder="Describa el gasto..."
                />
              </div>
              <div className={styles.modalRow}>
                <span>Fecha</span>
                <span className={styles.modalValue}>{new Date().toLocaleDateString()}</span>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.modalBtnSecondary} onClick={() => { setShowExpenseModal(false); setExpenseAmount(0); setExpenseReason(''); }}>Cancelar</button>
              <button className={styles.modalBtnPrimary} onClick={handleExpense} disabled={expenseAmount <= 0 || !expenseReason.trim()}>Registrar Gasto</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Success Modal */}
      {showSuccess && lastSale && createPortal(
        <div className={styles.modalOverlay} onClick={() => {}}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()} style={{ maxWidth: 420, padding: 0 }}>
            <div className={styles.successModalContent}>
              <div className={styles.successIconWrapper}>
                <svg className={styles.checkmark} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                  <circle className={styles.checkmarkCircle} cx="26" cy="26" r="25" fill="none" />
                  <path className={styles.checkmarkCheck} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                </svg>
              </div>
              <div className={styles.successText}>¡Venta Completada!</div>
              <div className={styles.successSubtext}>
                Pago: {paymentLabel(lastSale.paymentMethod)}
                {lastSale.customerName && ` — ${lastSale.customerName}`}
              </div>

              <div className={styles.ticketCard} id="sale-ticket">
                <div className={styles.ticketHeader}>
                  <div className={styles.ticketBrand}>STOCKMASTER PRO</div>
                  <div className={styles.ticketSubtitle}>Comprobante de Venta</div>
                </div>
                <div className={styles.ticketDivider} />
                <div className={styles.ticketDetails}>
                  <div>Fecha: {lastSale.date.toLocaleDateString()} {lastSale.date.toLocaleTimeString()}</div>
                  <div>Método: {paymentLabel(lastSale.paymentMethod)}</div>
                  {lastSale.customerName && <div>Cliente: {lastSale.customerName}</div>}
                  <div>Cajero: {user?.name}</div>
                </div>
                <div className={styles.ticketDivider} />
                {lastSale.items.map((item, i) => (
                  <div key={i} className={styles.ticketItem}>
                    <div className={styles.ticketItemInfo}>
                      <span>{item.product.name}</span>
                      <span className={styles.ticketItemQtyPrice}>{item.quantity} x ${item.product.price.toFixed(2)}</span>
                    </div>
                    <span>${(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className={styles.ticketDivider} />
                <div className={styles.ticketTotals}>
                  <div className={styles.ticketTotalRow}>
                    <span>Subtotal</span>
                    <span>${lastSale.subtotal.toFixed(2)}</span>
                  </div>
                  <div className={styles.ticketTotalRow}>
                    <span>IVA (16%)</span>
                    <span>${lastSale.tax.toFixed(2)}</span>
                  </div>
                  <div className={`${styles.ticketTotalRow} ${styles.ticketGrandTotal}`}>
                    <span>TOTAL</span>
                    <span>${lastSale.total.toFixed(2)}</span>
                  </div>
                </div>
                <div className={styles.ticketFooter}>
                  ¡Gracias por su compra!
                </div>
              </div>

              <div className={styles.actionsRow}>
                <button className={styles.printBtn} onClick={handlePrintTicket}>
                  <Printer size={16} /> Ver Ticket
                </button>
                <button className={styles.newSaleBtn} onClick={handleNewSale}>
                  <Plus size={16} /> Nueva Venta
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
