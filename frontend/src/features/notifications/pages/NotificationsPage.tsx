import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, TriangleAlert, CheckCircle, MessageSquare, BellRing, ArrowLeft } from 'lucide-react';
import { getNotifications, markAsRead, markAllAsRead } from '@shared/lib/http/notifications.api';
import { useToast } from '@contexts/ToastContext';
import styles from './NotificationsPage.module.css';

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

const notifIconMap: Record<string, any> = {
  critical: TriangleAlert,
  success: CheckCircle,
  info: MessageSquare,
};

export function NotificationsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | string>('all');

  const load = async () => {
    setLoading(true);
    try {
      const data = await getNotifications();
      setNotifications(data || []);
    } catch (err: any) {
      showToast(err.message || 'Error al cargar notificaciones', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleMarkAsRead = async (id: string) => {
    try { await markAsRead(id); setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n)); } catch {}
  };

  const handleMarkAllAsRead = async () => {
    try { await markAllAsRead(); setNotifications(prev => prev.map(n => ({ ...n, unread: false }))); showToast('Todas marcadas como leídas', 'success'); } catch {}
  };

  const handleClick = (n: Notification) => {
    if (n.unread) handleMarkAsRead(n.id);
    if (n.link) navigate(n.link);
  };

  const filtered = filter === 'all' ? notifications : filter === 'unread' ? notifications.filter(n => n.unread) : notifications.filter(n => n.category === filter);

  const categories = Array.from(new Set(notifications.map(n => n.category)));
  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}><ArrowLeft size={18} /></button>
        <h2 className={styles.title}>Notificaciones</h2>
        {unreadCount > 0 && (
          <button className={styles.markAllBtn} onClick={handleMarkAllAsRead}>Marcar todo como leído</button>
        )}
      </div>

      <div className={styles.kpiRow}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiValue}>{notifications.length}</span>
          <span className={styles.kpiLabel}>Total</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={`${styles.kpiValue} ${styles.kpiValueOrange}`}>{unreadCount}</span>
          <span className={styles.kpiLabel}>Sin leer</span>
        </div>
      </div>

      <div className={styles.filterBar}>
        <button className={`${styles.filterBtn} ${filter === 'all' ? styles.filterActive : ''}`} onClick={() => setFilter('all')}>Todas</button>
        <button className={`${styles.filterBtn} ${filter === 'unread' ? styles.filterActive : ''}`} onClick={() => setFilter('unread')}>Sin leer</button>
        {categories.map(cat => (
          <button key={cat} className={`${styles.filterBtn} ${filter === cat ? styles.filterActive : ''}`} onClick={() => setFilter(cat)}>{cat}</button>
        ))}
      </div>

      <div className={styles.list}>
        {loading ? (
          <div className={styles.empty}><span>Cargando...</span></div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <Bell size={32} className={styles.bellMuted} />
            <span>No hay notificaciones</span>
          </div>
        ) : (
          filtered.map(n => {
            const Icon = notifIconMap[n.type] || MessageSquare;
            return (
              <div key={n.id} className={`${styles.item} ${n.unread ? styles.itemUnread : ''}`} onClick={() => handleClick(n)}>
                <div className={`${styles.iconBox} ${styles[`icon${n.type.charAt(0).toUpperCase() + n.type.slice(1)}`]}`}>
                  <Icon size={16} />
                </div>
                <div className={styles.content}>
                  <div className={styles.itemTitle}>{n.title}</div>
                  <div className={styles.itemMessage}>{n.message}</div>
                  <div className={styles.itemMeta}>
                    {n.unread && <span className={styles.dot} />}
                    <span>{n.time}</span>
                    <span>•</span>
                    <span>{n.category}</span>
                  </div>
                </div>
                {n.unread && <button className={styles.readBtn} onClick={(e) => { e.stopPropagation(); handleMarkAsRead(n.id); }} title="Marcar como leído"><BellRing size={14} /></button>}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
