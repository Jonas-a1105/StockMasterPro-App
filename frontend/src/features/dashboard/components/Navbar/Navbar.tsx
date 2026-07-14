import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { useExchangeRate } from '@contexts/ExchangeRateContext';
import { Menu, Bell, TriangleAlert, CheckCircle, MessageSquare, BellRing } from 'lucide-react';
import { ExchangeRateWidget } from '../ExchangeRateWidget';
import { AnalyticsModal } from '../AnalyticsModal';
import { Skeleton } from '@shared/ui/Skeleton';
import { getNotifications, markAsRead, markAllAsRead } from '@shared/lib/http/notifications.api';
import styles from './Navbar.module.css';

interface Notification {
  id: string;
  type: 'critical' | 'success' | 'info';
  title: string;
  message: string;
  time: string;
  category: string;
  unread: boolean;
  link?: string;
}

export function Navbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { rate, loading, config } = useExchangeRate();
  const [showWidget, setShowWidget] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const notifModalRef = useRef<HTMLDivElement>(null);
  const bellBtnRef = useRef<HTMLButtonElement>(null);

  const unreadCount = notifications.filter((n) => n.unread).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notifModalRef.current &&
        bellBtnRef.current &&
        !notifModalRef.current.contains(event.target as Node) &&
        !bellBtnRef.current.contains(event.target as Node)
      ) {
        setShowNotifModal(false);
      }
    }
    if (showNotifModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifModal]);

  useEffect(() => {
    if (showNotifModal) {
      setLoadingNotifs(true);
      getNotifications()
        .then(setNotifications)
        .catch(() => {})
        .finally(() => setLoadingNotifs(false));
    }
  }, [showNotifModal]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
    } catch {}
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    } catch {}
  };

  const handleNotificationClick = (n: Notification) => {
    setShowNotifModal(false);
    if (n.unread) handleMarkAsRead(n.id);
    if (n.link) navigate(n.link);
  };

  const notifIconMap: Record<string, any> = {
    critical: TriangleAlert,
    success: CheckCircle,
    info: MessageSquare,
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.navbarLeft}>
        <button
          id="nav-toggle"
          className={styles.menuToggle}
          onClick={onToggleSidebar}
          aria-label="Abrir Menú"
        >
          <Menu size={24} />
        </button>
      </div>

      <div className={styles.actions}>
        {loading ? (
          <div
            className={`${styles.dolarWidget} ${styles.cursorDefault} ${styles.bgTransparent} ${styles.borderTransparent}`}
          >
            <Skeleton width={110} height={20} borderRadius={4} />
          </div>
        ) : (
          rate > 0 && (
            <div
              className={styles.dolarWidget}
              onClick={() => setShowWidget(true)}
              title={`1 USD = ${rate.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs. Click para abrir widget.`}
            >
              <span className={styles.dolarSign}>$</span>
              <span className={styles.dolarValue}>
                {config.symbol} {rate.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
              </span>
              <span className={styles.dolarTag}>BCV</span>
            </div>
          )
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
                  <BellRing size={14} className={styles.colorPrimary} />
                  Notificaciones
                </div>
                {unreadCount > 0 && (
                  <button className={styles.notifModalClearAll} onClick={handleMarkAllAsRead}>
                    Marcar todo como leído
                  </button>
                )}
              </div>

              <div className={styles.notifModalFeed}>
                {loadingNotifs ? (
                  <div className={styles.notifModalEmpty}>
                    <span>Cargando...</span>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className={styles.notifModalEmpty}>
                    <Bell size={24} className={styles.colorMuted} />
                    <span>No tienes notificaciones</span>
                  </div>
                ) : (
                  notifications.slice(0, 10).map((n) => {
                    const Icon = notifIconMap[n.type] || MessageSquare;
                    return (
                      <button
                        key={n.id}
                        className={`${styles.notifModalItem} ${styles[`notifModal${n.type.charAt(0).toUpperCase() + n.type.slice(1)}`]} ${n.unread ? styles.notifModalUnread : ''}`}
                        onClick={() => handleNotificationClick(n)}
                        role="menuitem"
                      >
                        <div className={styles.notifModalIconBox}>
                          <Icon size={13} />
                        </div>
                        <div className={styles.notifModalDetails}>
                          <span className={styles.notifModalTitleText}>{n.title}</span>
                          <span className={styles.notifModalMessage}>{n.message}</span>
                          <span className={styles.notifModalTime}>
                            {n.time} • {n.category}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              <div className={styles.notifModalFooter}>
                <button
                  className={styles.notifModalViewAll}
                  onClick={() => {
                    setShowNotifModal(false);
                    navigate('/notifications');
                  }}
                >
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

      {showWidget && (
        <ExchangeRateWidget
          onClose={() => setShowWidget(false)}
          onOpenAnalytics={() => setShowAnalytics(true)}
        />
      )}
      {showAnalytics && <AnalyticsModal onClose={() => setShowAnalytics(false)} />}
    </nav>
  );
}
