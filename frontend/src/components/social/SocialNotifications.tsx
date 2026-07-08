import { useState, useEffect } from 'react';
import { Bell, Heart, MessageCircle, UserPlus, Mail, CheckCheck } from 'lucide-react';
import { Skeleton } from '../../components/common/Skeleton';
import { api } from '../../lib/api';
import type { SocialNotification } from '../../types';

function NotifSkeleton() {
  return (
    <div className="ig-notif-item" style={{ pointerEvents: 'none' }}>
      <Skeleton variant="circle" width={44} height={44} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Skeleton height={12} width="70%" />
        <Skeleton height={10} width="40%" />
      </div>
    </div>
  );
}

const notifIcons: Record<string, any> = {
  like: Heart,
  comment: MessageCircle,
  comment_reply: MessageCircle,
  follow: UserPlus,
  message: Mail,
  catalog_like: Heart,
  catalog_comment: MessageCircle,
};

export function SocialNotifications() {
  const [notifications, setNotifications] = useState<SocialNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => { loadNotifications(); }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await api.getSocialNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error('Error loading notifications', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  };

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const displayNotifs = filter === 'unread' ? notifications.filter(n => !n.isRead) : notifications;

  const NotifIcon = ({ type }: { type: string }) => {
    const Icon = notifIcons[type] || Bell;
    return <Icon size={18} />;
  };

  return (
    <div className="ig-notifications">
      <div className="ig-notif-header">
        <h2>Notificaciones</h2>
        <div className="ig-notif-actions">
          <button className={`ig-notif-filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Todas</button>
          <button className={`ig-notif-filter-btn ${filter === 'unread' ? 'active' : ''}`} onClick={() => setFilter('unread')}>No leídas</button>
          {unreadCount > 0 && (
            <button className="ig-notif-mark-read" onClick={handleMarkAllRead}>
              <CheckCheck size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="ig-notif-list">
        {loading ? (
          <><NotifSkeleton /><NotifSkeleton /><NotifSkeleton /><NotifSkeleton /><NotifSkeleton /></>
        ) : displayNotifs.map(notif => (
          <div key={notif.id} className={`ig-notif-item ${!notif.isRead ? 'unread' : ''}`} onClick={() => handleMarkRead(notif.id)}>
            <div className="ig-notif-icon">
              {notif.fromUser?.socialProfile?.avatarUrl ? (
                <img src={notif.fromUser.socialProfile.avatarUrl} alt="" />
              ) : (
                <div className="ig-notif-icon-bg"><NotifIcon type={notif.type} /></div>
              )}
            </div>
            <div className="ig-notif-body">
              <p><strong>{notif.fromUser?.name || 'Alguien'}</strong> {notif.message}</p>
              <span className="ig-notif-time">{formatNotifTime(notif.createdAt)}</span>
            </div>
            {!notif.isRead && <div className="ig-notif-dot" />}
          </div>
        ))}
        {displayNotifs.length === 0 && !loading && (
          <div className="ig-empty-state">
            <Bell size={48} strokeWidth={1} />
            <p>No hay notificaciones</p>
          </div>
        )}
      </div>
    </div>
  );
}

function formatNotifTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Hace ${days}d`;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}
