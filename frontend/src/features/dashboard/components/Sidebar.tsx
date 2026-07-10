import { useRef, useState, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { LayoutDashboard, ShoppingCart, Package, Settings, LogOut, BarChart3, ChevronRight, Users, Contact, Receipt, ReceiptText, RotateCcw, DollarSign, AlertTriangle, Building2, CalendarDays, Shield, Lock, Share2, Wallet, Bell, Tag, RotateCcw as ReturnIcon, ArrowRightLeft, Boxes, FileText } from 'lucide-react';
import type { SidebarMode } from './DashboardLayout';
import styles from './Sidebar.module.css';

const SWIPE_THRESHOLD = 80;
const COMPACT_WIDTH = 60;
const FULL_WIDTH = 260;



export function Sidebar({ mode, onClose, isMobile }: { mode: SidebarMode; onClose: () => void; isMobile: boolean }) {
  const { user, logout, licenseStatus } = useAuth();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [dragWidth, setDragWidth] = useState<number | null>(null);
  const touchStartRef = useRef({ x: 0, sidebarLeft: 0 });

  const currentPlan = licenseStatus?.tier || 'free';

  const isRouteLocked = (to: string): boolean => {
    if (to === '/admin/tenants') {
      return user?.email !== 'admin@stockmaster.com';
    }
    if (currentPlan === 'free') {
      const freeBlocks = [
        '/agenda',
        '/warehouses',
        '/accounts-payable',
        '/accounts-receivable',
        '/cash-register',
        '/expenses',
        '/customers',
        '/credit-notes',
        '/reports',
        '/net-profit',
        '/best-sellers',
        '/sales'
      ];
      return freeBlocks.includes(to);
    }
    if (currentPlan === 'intermedio') {
      const intermedioBlocks = ['/agenda', '/credit-notes'];
      return intermedioBlocks.includes(to);
    }
    return false;
  };

  const lastVisibleModeRef = useRef<'compact' | 'open'>('compact');

  if (isMobile && mode !== 'hidden') {
    lastVisibleModeRef.current = mode === 'compact' ? 'compact' : 'open';
  }

  const modeClass = isMobile
    ? mode === 'hidden'
      ? `${styles.hidden} ${lastVisibleModeRef.current === 'compact' ? styles.compact : styles.open}`
      : mode === 'compact' ? styles.compact
      : styles.open
    : mode === 'full' ? styles.open
    : styles.collapsed;

  const showOverlay = isMobile && (mode === 'compact' || mode === 'full');

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile || mode !== 'compact') return;
    const el = sidebarRef.current;
    if (!el) return;
    touchStartRef.current = {
      x: e.touches[0].clientX,
      sidebarLeft: el.getBoundingClientRect().left,
    };
  }, [isMobile, mode]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isMobile || mode !== 'compact') return;
    const dx = e.touches[0].clientX - touchStartRef.current.x;
    const newWidth = Math.max(COMPACT_WIDTH, Math.min(FULL_WIDTH, COMPACT_WIDTH + dx));
    setDragWidth(newWidth);
  }, [isMobile, mode]);

  const handleTouchEnd = useCallback(() => {
    if (!isMobile || mode !== 'compact') return;
    const current = dragWidth ?? COMPACT_WIDTH;
    setDragWidth(null);
    if (current >= COMPACT_WIDTH + SWIPE_THRESHOLD) {
      document.getElementById('nav-toggle')?.click();
    }
  }, [isMobile, mode, dragWidth]);

  const dragStyle = isMobile && dragWidth !== null
    ? { width: dragWidth, transition: 'none' }
    : undefined;

  const nav = (to: string, icon: any, label: string) => {
    const locked = isRouteLocked(to);
    return (
      <NavLink
        to={to}
        className={({ isActive }) => `${styles.menuItem} ${isActive ? styles.active : ''} ${locked ? styles.menuItemLocked : ''}`}
        onClick={isMobile ? onClose : undefined}
      >
        {icon}
        <span>{label}</span>
        {locked ? (
          <Lock size={10} className={styles.lockIcon} />
        ) : (
          <ChevronRight size={10} className={styles.arrow} />
        )}
      </NavLink>
    );
  };

  return (
    <>
      {showOverlay && <div className={styles.overlay} onClick={onClose} />}
      <aside
        ref={sidebarRef}
        className={`${styles.sidebar} ${modeClass} ${dragWidth !== null ? styles.dragging : ''}`}
        style={dragStyle}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className={styles.brandBox}>
          <svg viewBox="0 0 240 240" fill="none" className={styles.logoSvg}>
            <path className={styles.sidebarStroke} d="
              M 65 90 
              C 40 90, 40 115, 60 120 
              C 80 125, 80 150, 55 150 
              L 85 85 
              L 105 125 
              L 125 85 
              L 125 150 
              H 185 
              V 115 
              H 135 
              V 150
            " />
            <path className={styles.sidebarCrown} d="
              M 145 110 
              L 140 97 
              L 151 102 
              L 160 88 
              L 169 102 
              L 180 97 
              L 175 110 
              Z
            " />
            <text x="144" y="141" className={styles.sidebarPro}>PRO</text>
          </svg>
        </div>

        <nav className={styles.menu}>
          {nav('/dashboard', <LayoutDashboard size={16} className={styles.menuIcon} />, 'Panel de Control')}

          {nav('/pos', <ShoppingCart size={16} className={styles.menuIcon} />, 'Punto de Venta')}
          {nav('/sales', <ReceiptText size={16} className={styles.menuIcon} />, 'Historial Ventas')}
          {nav('/reports', <BarChart3 size={16} className={styles.menuIcon} />, 'Reportes')}
          {nav('/best-sellers', <BarChart3 size={16} className={styles.menuIcon} />, 'Best-Sellers')}
          {nav('/net-profit', <DollarSign size={16} className={styles.menuIcon} />, 'Utilidad Neta')}

          {nav('/agenda', <CalendarDays size={16} className={styles.menuIcon} />, 'Agenda Digital')}

          {nav('/inventory', <Package size={16} className={styles.menuIcon} />, 'Inventario')}
          {nav('/warehouses', <Building2 size={16} className={styles.menuIcon} />, 'Almacenes')}
          {nav('/low-stock', <AlertTriangle size={16} className={styles.menuIcon} />, 'Alertas Stock')}
          {nav('/categories', <Tag size={16} className={styles.menuIcon} />, 'Categorías')}
          {nav('/credit-notes', <RotateCcw size={16} className={styles.menuIcon} />, 'Notas de Crédito')}
          {nav('/returns', <ReturnIcon size={16} className={styles.menuIcon} />, 'Devoluciones')}
          {nav('/warehouse-transfers', <ArrowRightLeft size={16} className={styles.menuIcon} />, 'Transferencias')}
          {nav('/product-lots', <Boxes size={16} className={styles.menuIcon} />, 'Lotes y Vencimientos')}

          {nav('/accounts-payable', <Receipt size={16} className={styles.menuIcon} />, 'Cuentas por Pagar')}
          {nav('/accounts-receivable', <DollarSign size={16} className={styles.menuIcon} />, 'Cuentas por Cobrar')}
          {nav('/cash-register', <Wallet size={16} className={styles.menuIcon} />, 'Caja')}
          {nav('/expenses', <ReceiptText size={16} className={styles.menuIcon} />, 'Gastos')}

          {nav('/customers', <Contact size={16} className={styles.menuIcon} />, 'Clientes')}

          {user?.role === 'admin' && nav('/users', <Users size={16} className={styles.menuIcon} />, 'Usuarios')}
          {user?.email === 'admin@stockmaster.com' && (
            <>
              {nav('/admin/tenants', <Shield size={16} className={styles.menuIcon} />, 'Licencias')}
              {nav('/admin/saas-dashboard', <BarChart2 size={16} className={styles.menuIcon} />, 'SaaS Metrics')}
            </>
          )}
          {nav('/settings', <Settings size={16} className={styles.menuIcon} />, 'Configuración')}
          {nav('/notifications', <Bell size={16} className={styles.menuIcon} />, 'Notificaciones')}
          {nav('/fiscal', <FileText size={16} className={styles.menuIcon} />, 'Fiscal')}
          <div className={styles.divider} />
          {nav('/social', <Share2 size={16} className={styles.menuIcon} />, 'Social')}
        </nav>

        <div className={styles.footer}>
          <button className={styles.exitBtn} onClick={logout}>
            <LogOut size={16} />
            <span>Salir</span>
          </button>
        </div>
      </aside>
    </>
  );
}
