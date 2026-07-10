import { useState, useEffect } from 'react';
import { api } from '@shared/lib/http/client';
import { useToast } from '@contexts/ToastContext';
import { Smartphone, Monitor, Globe, XCircle } from 'lucide-react';

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

  useEffect(() => { load(); }, []);

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

  if (loading) return <p style={{ color: 'var(--text-muted)', padding: 20 }}>Cargando sesiones...</p>;

  return (
    <div style={{ padding: '12px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>Sesiones activas ({sessions.length})</h3>
        {sessions.length > 1 && (
          <button onClick={logoutAll} style={{ padding: '6px 14px', border: '1px solid #ef4444', borderRadius: 6, background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: 13 }}>
            Cerrar todas
          </button>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sessions.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No hay sesiones activas</p>
        ) : sessions.map((s: any) => {
          const ua = s.userAgent || '';
          const isMobile = /mobile|android|iphone|ipad/i.test(ua);
          return (
            <div key={s.id || s.deviceId} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px', borderRadius: 8,
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
            }}>
              {getDeviceIcon(ua)}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 14 }}>
                  {isMobile ? 'Dispositivo móvil' : 'Navegador web'}
                  {s.isCurrent && <span style={{ marginLeft: 8, fontSize: 11, color: '#22c55e' }}>(actual)</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {s.ipAddress ? `IP: ${s.ipAddress}` : ''}
                  {s.lastActivity ? ` · Última actividad: ${new Date(s.lastActivity).toLocaleString()}` : ''}
                </div>
              </div>
              {!s.isCurrent && (
                <button onClick={() => logoutDevice(s.deviceId)} style={{
                  padding: '6px 10px', border: 'none', borderRadius: 6,
                  background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer',
                }} title="Cerrar sesión"><XCircle size={16} /></button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
