import { useRef, useState, useCallback, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Settings,
  LogOut,
  BarChart3,
  BarChart2,
  ChevronRight,
  ChevronDown,
  Users,
  Contact,
  Receipt,
  ReceiptText,
  RotateCcw,
  DollarSign,
  AlertTriangle,
  Building2,
  CalendarDays,
  Shield,
  Lock,
  Share2,
  Wallet,
  Bell,
  Tag,
  RotateCcw as ReturnIcon,
  ArrowRightLeft,
  Boxes,
  FileText,
} from 'lucide-react';
import type { SidebarMode } from './DashboardLayout';
import styles from './Sidebar.module.css';

const SWIPE_THRESHOLD = 80;
const COMPACT_WIDTH = 60;
const FULL_WIDTH = 260;

export function Sidebar({
  mode,
  onClose,
  isMobile,
  onToggleMode,
}: {
  mode: SidebarMode;
  onClose: () => void;
  isMobile: boolean;
  onToggleMode?: (m: SidebarMode) => void;
}) {
  const { user, logout, licenseStatus } = useAuth();
  const location = useLocation();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [dragWidth, setDragWidth] = useState<number | null>(null);
  const touchStartRef = useRef({ x: 0, sidebarLeft: 0 });
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

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
        '/sales',
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
      : mode === 'compact'
        ? styles.compact
        : styles.open
    : mode === 'full'
      ? styles.open
      : styles.collapsed;

  const showOverlay = isMobile && (mode === 'compact' || mode === 'full');

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!isMobile || mode !== 'compact') return;
      const el = sidebarRef.current;
      if (!el) return;
      touchStartRef.current = {
        x: e.touches[0].clientX,
        sidebarLeft: el.getBoundingClientRect().left,
      };
    },
    [isMobile, mode]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isMobile || mode !== 'compact') return;
      const dx = e.touches[0].clientX - touchStartRef.current.x;
      const newWidth = Math.max(COMPACT_WIDTH, Math.min(FULL_WIDTH, COMPACT_WIDTH + dx));
      setDragWidth(newWidth);
    },
    [isMobile, mode]
  );

  const handleTouchEnd = useCallback(() => {
    if (!isMobile || mode !== 'compact') return;
    const current = dragWidth ?? COMPACT_WIDTH;
    setDragWidth(null);
    if (current >= COMPACT_WIDTH + SWIPE_THRESHOLD) {
      if (onToggleMode) {
        onToggleMode('full');
      } else {
        document.getElementById('nav-toggle')?.click();
      }
    }
  }, [isMobile, mode, dragWidth, onToggleMode]);

  const dragStyle =
    isMobile && dragWidth !== null ? { width: dragWidth, transition: 'none' } : undefined;

  const nav = (to: string, icon: any, label: string, isSubItem = false) => {
    const locked = isRouteLocked(to);
    return (
      <NavLink
        key={to}
        to={to}
        className={({ isActive }) =>
          `${styles.menuItem} ${isActive ? styles.active : ''} ${locked ? styles.menuItemLocked : ''} ${isSubItem ? styles.subMenuItem : ''}`
        }
        onClick={isMobile ? onClose : undefined}
      >
        {icon}
        <span>{label}</span>
        {locked ? (
          <Lock size={10} className={styles.lockIcon} />
        ) : (
          !isSubItem && <ChevronRight size={10} className={styles.arrow} />
        )}
      </NavLink>
    );
  };

  const sections = [
    {
      id: 'sales',
      label: 'Operaciones',
      icon: <ShoppingCart size={16} className={styles.menuIcon} />,
      items: [
        { to: '/pos', icon: <ShoppingCart size={16} className={styles.menuIcon} />, label: 'Punto de Venta' },
        { to: '/sales', icon: <ReceiptText size={16} className={styles.menuIcon} />, label: 'Historial Ventas' },
        { to: '/cash-register', icon: <Wallet size={16} className={styles.menuIcon} />, label: 'Caja' },
        { to: '/agenda', icon: <CalendarDays size={16} className={styles.menuIcon} />, label: 'Agenda Digital' },
      ],
    },
    {
      id: 'inventory',
      label: 'Inventario',
      icon: <Package size={16} className={styles.menuIcon} />,
      items: [
        { to: '/inventory', icon: <Package size={16} className={styles.menuIcon} />, label: 'Inventario' },
        { to: '/warehouses', icon: <Building2 size={16} className={styles.menuIcon} />, label: 'Almacenes' },
        { to: '/categories', icon: <Tag size={16} className={styles.menuIcon} />, label: 'Categorías' },
        { to: '/warehouse-transfers', icon: <ArrowRightLeft size={16} className={styles.menuIcon} />, label: 'Transferencias' },
        { to: '/product-lots', icon: <Boxes size={16} className={styles.menuIcon} />, label: 'Lotes y Vencimientos' },
        { to: '/low-stock', icon: <AlertTriangle size={16} className={styles.menuIcon} />, label: 'Alertas Stock' },
      ],
    },
    {
      id: 'finance',
      label: 'Finanzas',
      icon: <DollarSign size={16} className={styles.menuIcon} />,
      items: [
        { to: '/accounts-payable', icon: <Receipt size={16} className={styles.menuIcon} />, label: 'Cuentas por Pagar' },
        { to: '/accounts-receivable', icon: <DollarSign size={16} className={styles.menuIcon} />, label: 'Cuentas por Cobrar' },
        { to: '/expenses', icon: <ReceiptText size={16} className={styles.menuIcon} />, label: 'Gastos' },
        { to: '/credit-notes', icon: <RotateCcw size={16} className={styles.menuIcon} />, label: 'Notas de Crédito' },
        { to: '/returns', icon: <ReturnIcon size={16} className={styles.menuIcon} />, label: 'Devoluciones' },
      ],
    },
    {
      id: 'reports',
      label: 'Reportes y Analítica',
      icon: <BarChart3 size={16} className={styles.menuIcon} />,
      items: [
        { to: '/reports', icon: <BarChart3 size={16} className={styles.menuIcon} />, label: 'Reportes' },
        { to: '/net-profit', icon: <DollarSign size={16} className={styles.menuIcon} />, label: 'Utilidad Neta' },
        { to: '/best-sellers', icon: <BarChart3 size={16} className={styles.menuIcon} />, label: 'Best-Sellers' },
        { to: '/dead-products', icon: <AlertTriangle size={16} className={styles.menuIcon} />, label: 'Productos Muertos' },
        { to: '/fiscal', icon: <FileText size={16} className={styles.menuIcon} />, label: 'Fiscal' },
      ],
    },
    {
      id: 'admin',
      label: 'Administración',
      icon: <Settings size={16} className={styles.menuIcon} />,
      items: [
        { to: '/customers', icon: <Contact size={16} className={styles.menuIcon} />, label: 'Clientes' },
        ...(user?.role === 'admin' ? [{ to: '/users', icon: <Users size={16} className={styles.menuIcon} />, label: 'Usuarios' }] : []),
        ...(user?.email === 'admin@stockmaster.com'
          ? [
              { to: '/admin/tenants', icon: <Shield size={16} className={styles.menuIcon} />, label: 'Licencias' },
              { to: '/admin/saas-dashboard', icon: <BarChart2 size={16} className={styles.menuIcon} />, label: 'SaaS Metrics' },
            ]
          : []),
        { to: '/settings', icon: <Settings size={16} className={styles.menuIcon} />, label: 'Configuración' },
      ],
    },
  ];

  useEffect(() => {
    // Auto-expand section containing active path on load or navigate
    sections.forEach((sec) => {
      const hasActive = sec.items.some((item) => location.pathname === item.to);
      if (hasActive) {
        setOpenSections((prev) => ({ ...prev, [sec.id]: true }));
      }
    });
  }, [location.pathname]);

  const handleSectionClick = (sectionId: string) => {
    const isCollapsed = mode === 'compact';
    if (isCollapsed) {
      if (onToggleMode) {
        onToggleMode('full');
      } else {
        document.getElementById('nav-toggle')?.click();
      }
      setOpenSections((prev) => ({ ...prev, [sectionId]: true }));
    } else {
      setOpenSections((prev) => ({
        ...prev,
        [sectionId]: !prev[sectionId],
      }));
    }
  };

  const renderSection = (sec: any) => {
    const isOpen = !!openSections[sec.id];
    const isCollapsed = mode === 'compact';
    const hasActiveChild = sec.items.some((item: any) => location.pathname === item.to);

    return (
      <div key={sec.id} className={`${styles.accordionSection} ${isOpen ? styles.sectionOpen : ''} ${hasActiveChild ? styles.sectionHasActive : ''}`}>
        <button
          type="button"
          className={`${styles.accordionHeader} ${hasActiveChild ? styles.activeHeader : ''}`}
          onClick={() => handleSectionClick(sec.id)}
          title={isCollapsed ? sec.label : undefined}
        >
          {sec.icon}
          <span className={styles.sectionText}>{sec.label}</span>
          {!isCollapsed && (
            <ChevronDown size={14} className={`${styles.chevron} ${isOpen ? styles.chevronRotated : ''}`} />
          )}
        </button>

        {isOpen && !isCollapsed && (
          <div className={styles.accordionContent}>
            {sec.items.map((item: any) => nav(item.to, item.icon, item.label, true))}
          </div>
        )}
      </div>
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
            <path
              className={styles.sidebarStroke}
              d="
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
            "
            />
            <path
              className={styles.sidebarCrown}
              d="
              M 145 110 
              L 140 97 
              L 151 102 
              L 160 88 
              L 169 102 
              L 180 97 
              L 175 110 
              Z
            "
            />
            <text x="144" y="141" className={styles.sidebarPro}>
              PRO
            </text>
          </svg>
        </div>

        <nav className={styles.menu}>
          {nav(
            '/dashboard',
            <LayoutDashboard size={16} className={styles.menuIcon} />,
            'Panel de Control'
          )}

          <div className={styles.divider} />

          {sections.map(renderSection)}

          <div className={styles.divider} />
          {nav('/notifications', <Bell size={16} className={styles.menuIcon} />, 'Notificaciones')}
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
