import { useState, useEffect } from 'react';
import { api } from '@shared/lib/http/client';
import { useToast } from '@contexts/ToastContext';
import { Smartphone, Monitor, Globe, XCircle } from 'lucide-react';
import styles from './SessionsTab.module.css';

export function SessionsTab() {
  const { showToast } = useToast();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get('/auth/sessions');
      setSessions(data || []);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const logoutDevice = async (deviceId: string) => {
    try {
      await api.post('/auth/logout/device', { deviceId });
      showToast('Sesión cerrada en ese dispositivo', 'success');
      load();
    } catch (err: any) {
      showToast(err.message || 'Error', 'error');
    }
  };

  const logoutAll = async () => {
    if (!window.confirm('¿Cerrar todas las sesiones? (incluyendo la actual)')) return;
    try {
      await api.post('/auth/logout/all', {});
      showToast('Todas las sesiones cerradas', 'success');
      load();
    } catch (err: any) {
      showToast(err.message || 'Error', 'error');
    }
  };

  const getDeviceIcon = (ua: string) => {
    if (/mobile|android|iphone|ipad/i.test(ua)) return <Smartphone size={16} />;
    return <Monitor size={16} />;
  };

  if (loading) return <p className={styles.loadingText}>Cargando sesiones...</p>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Sesiones activas ({sessions.length})</h3>
        {sessions.length > 1 && (
          <button onClick={logoutAll} className={styles.logoutAllBtn}>
            Cerrar todas
          </button>
        )}
      </div>
      <div className={styles.list}>
        {sessions.length === 0 ? (
          <p className={styles.emptyText}>No hay sesiones activas</p>
        ) : (
          sessions.map((s: any) => {
            const ua = s.userAgent || '';
            const isMobile = /mobile|android|iphone|ipad/i.test(ua);
            return (
              <div key={s.id || s.deviceId} className={styles.sessionCard}>
                {getDeviceIcon(ua)}
                <div className={styles.sessionInfo}>
                  <div className={styles.sessionName}>
                    {isMobile ? 'Dispositivo móvil' : 'Navegador web'}
                    {s.isCurrent && <span className={styles.currentBadge}>(actual)</span>}
                  </div>
                  <div className={styles.sessionMeta}>
                    {s.ipAddress ? `IP: ${s.ipAddress}` : ''}
                    {s.lastActivity
                      ? ` · Última actividad: ${new Date(s.lastActivity).toLocaleString()}`
                      : ''}
                  </div>
                </div>
                {!s.isCurrent && (
                  <button
                    onClick={() => logoutDevice(s.deviceId)}
                    className={styles.logoutBtn}
                    title="Cerrar sesión"
                  >
                    <XCircle size={16} />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
