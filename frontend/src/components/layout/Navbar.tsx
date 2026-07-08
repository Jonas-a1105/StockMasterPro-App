import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useExchangeRate } from '../../contexts/ExchangeRateContext';
import { Menu, Bell, TriangleAlert, CheckCircle, MessageSquare, BellRing } from 'lucide-react';
import { ExchangeRateWidget } from './ExchangeRateWidget';
import { AnalyticsModal } from './AnalyticsModal';
import { Skeleton } from '../common/Skeleton';
import styles from './Navbar.module.css';

interface Notification {
  id: number;
  type: 'critical' | 'success' | 'info';
  title: string;
  message: string;
  time: string;
  category: string;
  unread: boolean;
}

const mockNotifications: Notification[] = [
  { id: 1, type: 'critical', title: 'Fallo de replicación en clúster', message: 'La sincronización con la base de datos redundante ha fallado.', time: 'Hace 3 min', category: 'Seguridad', unread: true },
  { id: 2, type: 'success', title: 'Actualización de Core lista', message: 'El paquete estable v2.4.0 se compiló con éxito y espera despliegue.', time: 'Hace 25 min', category: 'Sistema', unread: true },
  { id: 3, type: 'info', title: 'Ticket asignado a Jonas', message: 'Se te ha asignado el ticket de soporte técnico #SGEN-4082.', time: 'Hace 2 horas', category: 'Soporte', unread: false },
];

export function Navbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { user } = useAuth();
  const { rate, loading } = useExchangeRate();
  const [showWidget, setShowWidget] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const notifModalRef = useRef<HTMLDivElement>(null);
  const bellBtnRef = useRef<HTMLButtonElement>(null);

  const unreadCount = notifications.filter(n => n.unread).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifModalRef.current && bellBtnRef.current &&
          !notifModalRef.current.contains(event.target as Node) &&
          !bellBtnRef.current.contains(event.target as Node)) {
        setShowNotifModal(false);
      }
    }
    if (showNotifModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifModal]);

  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const notifIconMap: Record<string, any> = {
    critical: TriangleAlert,
    success: CheckCircle,
    info: MessageSquare,
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.navbarLeft}>
        <button id="nav-toggle" className={styles.menuToggle} onClick={onToggleSidebar} aria-label="Abrir Menú">
          <Menu size={24} />
        </button>
      </div>

      <div className={styles.actions}>
        {loading ? (
          <div className={styles.dolarWidget} style={{ cursor: 'default', background: 'transparent', borderColor: 'transparent' }}>
            <Skeleton width={110} height={20} borderRadius={4} />
          </div>
        ) : rate > 0 && (
          <div className={styles.dolarWidget} onClick={() => setShowWidget(true)} title={`1 USD = ${rate.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs. Click para abrir widget.`}>
            <span className={styles.dolarSign}>$</span>
            <span className={styles.dolarValue}>VES {rate.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</span>
            <span className={styles.dolarTag}>BCV</span>
          </div>
        )}

        <div className={styles.notifWrapper}>
          <button
            ref={bellBtnRef}
            className={`${styles.iconBtn} ${showNotifModal ? styles.iconBtnActive : ''}`}
            onClick={() => setShowNotifModal(!showNotifModal)}
            aria-label="Notificaciones"
            aria-expanded={showNotifModal}
          >
            {showNotifModal ? <BellRing size={18} /> : <Bell size={18} />}
            {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
          </button>

          {showNotifModal && (
            <div ref={notifModalRef} className={styles.notifModal} role="menu">
              <div className={styles.notifModalHeader}>
                <div className={styles.notifModalTitle}>
                  <BellRing size={14} style={{ color: 'var(--color-primary)' }} />
                  Notificaciones
                </div>
                {unreadCount > 0 && (
                  <button className={styles.notifModalClearAll} onClick={markAllAsRead}>
                    Marcar todo como leído
                  </button>
                )}
              </div>

              <div className={styles.notifModalFeed}>
                {notifications.length === 0 ? (
                  <div className={styles.notifModalEmpty}>
                    <Bell size={24} style={{ color: 'var(--text-muted)' }} />
                    <span>No tienes notificaciones</span>
                  </div>
                ) : (
                  notifications.map(n => {
                    const Icon = notifIconMap[n.type];
                    return (
                      <button
                        key={n.id}
                        className={`${styles.notifModalItem} ${styles[`notifModal${n.type.charAt(0).toUpperCase() + n.type.slice(1)}`]} ${n.unread ? styles.notifModalUnread : ''}`}
                        onClick={() => n.unread && markAsRead(n.id)}
                        role="menuitem"
                      >
                        <div className={styles.notifModalIconBox}>
                          <Icon size={13} />
                        </div>
                        <div className={styles.notifModalDetails}>
                          <span className={styles.notifModalTitleText}>{n.title}</span>
                          <span className={styles.notifModalMessage}>{n.message}</span>
                          <span className={styles.notifModalTime}>{n.time} • {n.category}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              <div className={styles.notifModalFooter}>
                <button className={styles.notifModalViewAll} onClick={() => { /* navigate to settings notifications */ }}>
                  Ver todas las alertas
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={styles.user}>
          <span>{user?.name || 'Usuario'}</span>
          <div className={styles.avatar} />
        </div>
      </div>

      {showWidget && <ExchangeRateWidget onClose={() => setShowWidget(false)} onOpenAnalytics={() => setShowAnalytics(true)} />}
      {showAnalytics && <AnalyticsModal onClose={() => setShowAnalytics(false)} />}
    </nav>
  );
}
