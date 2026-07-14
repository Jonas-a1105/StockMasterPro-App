// src/features/settings/components/SessionsTab.tsx
import React, { useState, useEffect } from 'react';
import { api } from '@shared/lib/http/client';
import { useToast } from '@contexts/ToastContext';
import { Smartphone, Monitor, XCircle } from 'lucide-react';
import { Heading } from '@shared/ui/Heading';
import { Button } from '@shared/ui/Button';
import { Card } from '@shared/ui/Card';
import { Stack } from '@shared/ui/Stack';
import { Text } from '@shared/ui/Text';

export function SessionsTab() {
  const { showToast } = useToast();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
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

  if (loading) return <Text className="p4 textMuted">Cargando sesiones...</Text>;

  return (
    <Stack gap="md" className="wFull">
      <div className="flex justifyBetween itemsCenter mb4">
        <Heading level={3}>Sesiones activas ({sessions.length})</Heading>
      </div>

      <Stack gap="2" className="wFull">
        {sessions.length === 0 ? (
          <Text className="textMuted">No hay sesiones activas</Text>
        ) : (
          sessions.map((s: any) => {
            const ua = s.userAgent || '';
            const isMobile = /mobile|android|iphone|ipad/i.test(ua);

            return (
              // Usamos clases utilitarias globales atómicas en lugar de módulos locales CSS
              <div key={s.id || s.deviceId} className="flex itemsCenter gap3 p4 border roundedMd bgSurface">
                {isMobile ? <Smartphone size={16} className="textSecondary" /> : <Monitor size={16} className="textSecondary" />}

                <div className="flex1">
                  <div className="fontMedium textBase flex itemsCenter gap2">
                    {isMobile ? 'Dispositivo móvil' : 'Navegador web'}
                    {s.isCurrent && <span className="textXs textSuccess fontSemibold">(actual)</span>}
                  </div>
                  <div className="textXs textMuted mt1">
                    {s.ipAddress ? `IP: ${s.ipAddress}` : ''}
                    {s.lastActivity ? ` · Actividad: ${new Date(s.lastActivity).toLocaleString()}` : ''}
                  </div>
                </div>

                {!s.isCurrent && (
                  <Button variant="ghost" onClick={() => logoutDevice(s.deviceId)} title="Cerrar sesión">
                    <XCircle size={16} className="textDanger" />
                  </Button>
                )}
              </div>
            );
          })
        )}
      </Stack>
    </Stack>
  );
}