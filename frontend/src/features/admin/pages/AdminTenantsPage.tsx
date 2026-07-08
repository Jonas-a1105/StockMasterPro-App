import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, Plus, Minus } from 'lucide-react';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '@contexts/ToastContext';
import { useTheme } from '@contexts/ThemeContext';
import { SkeletonTable } from '@shared/ui/Skeleton';
import { api } from '@shared/lib/http/client';
import { Modal } from '@shared/ui/Modal';
import styles from './AdminTenantsPage.module.css';

const PLAN_OPTIONS = ['free', 'pro', 'enterprise'];

function formatDate(d: string | Date | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function AdminTenantsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { config } = useTheme();
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [extendModal, setExtendModal] = useState<{ id: string; name: string } | null>(null);
  const [extendDays, setExtendDays] = useState(30);
  const [planModal, setPlanModal] = useState<{ id: string; name: string; currentPlan: string } | null>(null);
  const [newPlan, setNewPlan] = useState('pro');

  const fetchTenants = async () => {
    try {
      const data = await api.getAdminTenants();
      setTenants(data);
    } catch {
      showToast('Error al cargar tenants', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== 'admin') return;
    fetchTenants();
  }, [user]);

  const handleBlock = async (id: string) => {
    setActionLoading(id);
    try {
      await api.blockTenant(id);
      showToast('Tenant bloqueado', 'success');
      fetchTenants();
    } catch {
      showToast('Error al bloquear', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnblock = async (id: string) => {
    setActionLoading(id);
    try {
      await api.unblockTenant(id);
      showToast('Tenant desbloqueado', 'success');
      fetchTenants();
    } catch {
      showToast('Error al desbloquear', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleExtend = async () => {
    if (!extendModal) return;
    setActionLoading(extendModal.id);
    try {
      await api.extendTenantLicense(extendModal.id, extendDays);
      showToast(`Licencia extendida ${extendDays} días`, 'success');
      setExtendModal(null);
      fetchTenants();
    } catch {
      showToast('Error al extender licencia', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleChangePlan = async () => {
    if (!planModal) return;
    setActionLoading(planModal.id);
    try {
      await api.changeTenantPlan(planModal.id, newPlan);
      showToast(`Plan cambiado a ${newPlan}`, 'success');
      setPlanModal(null);
      fetchTenants();
    } catch {
      showToast('Error al cambiar plan', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className={styles.container}>
        <div className={styles.card} style={{ textAlign: 'center', padding: 60 }}>
          <AlertTriangle size={32} style={{ color: 'var(--color-danger, #dc2626)', marginBottom: 12 }} />
          <h2 style={{ color: 'var(--text-dark, #fff)', margin: 0 }}>Acceso restringido</h2>
          <p style={{ color: 'var(--text-muted, #888)', marginTop: 8, fontSize: 13 }}>
            Solo los administradores pueden acceder al panel de gestión de licencias.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Shield size={20} />
        <h2 className={styles.title}>PANEL DE ADMINISTRACIÓN DE LICENCIAS</h2>
      </div>
      <p className={styles.subtitle}>Gestiona las licencias de todos los inquilinos del sistema.</p>

      <div className={styles.card}>
        <div className={styles.cardTitle}>EMPRESAS REGISTRADAS ({tenants.length})</div>
        {loading ? (
          config.skeletonEnabled ? (
            <SkeletonTable rows={5} cols={6} />
          ) : (
            <p className={styles.muted}>Cargando...</p>
          )
        ) : tenants.length === 0 ? (
          <p className={styles.muted}>No hay empresas registradas.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Plan</th>
                  <th>Estado</th>
                  <th>Vencimiento</th>
                  <th>Bloqueado</th>
                  <th style={{ width: 200 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map(t => {
                  const isExpired = new Date(t.licenseExpiresAt) < new Date();
                  const isCanceled = t.subscriptionStatus === 'canceled';
                  return (
                    <tr key={t.id} className={t.isBlocked ? styles.rowBlocked : ''}>
                      <td>
                        <div className={styles.cellName}>{t.name}</div>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${t.planType === 'enterprise' ? styles.badgeEnterprise : t.planType === 'pro' ? styles.badgePro : styles.badgeFree}`}>
                          {t.planType}
                        </span>
                      </td>
                      <td>
                        <span className={styles.statusBadge} style={{
                          color: isCanceled ? '#dc2626' : isExpired ? '#f97316' : '#16a34a',
                        }}>
                          {isCanceled ? 'Cancelada' : isExpired ? 'Expirada' : 'Activa'}
                        </span>
                      </td>
                      <td className={styles.cellDate}>{formatDate(t.licenseExpiresAt)}</td>
                      <td>
                        {t.isBlocked ? (
                          <XCircle size={16} style={{ color: '#dc2626' }} />
                        ) : (
                          <CheckCircle size={16} style={{ color: '#16a34a' }} />
                        )}
                      </td>
                      <td>
                        <div className={styles.actions}>
                          {t.isBlocked ? (
                            <button className={styles.actionBtn} onClick={() => handleUnblock(t.id)} disabled={actionLoading === t.id} title="Desbloquear">
                              <CheckCircle size={13} /> Desbloquear
                            </button>
                          ) : (
                            <button className={`${styles.actionBtn} ${styles.actionDanger}`} onClick={() => handleBlock(t.id)} disabled={actionLoading === t.id} title="Bloquear">
                              <XCircle size={13} /> Bloquear
                            </button>
                          )}
                          <button className={styles.actionBtn} onClick={() => { setExtendModal({ id: t.id, name: t.name }); setExtendDays(30); }} title="Extender licencia">
                            <Plus size={13} /> Extender
                          </button>
                          <button className={styles.actionBtn} onClick={() => { setPlanModal({ id: t.id, name: t.name, currentPlan: t.planType }); setNewPlan(t.planType); }} title="Cambiar plan">
                            <Minus size={13} /> Plan
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={!!extendModal} onClose={() => setExtendModal(null)} title="Extender Licencia">
        {extendModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '8px 0' }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted, #888)', margin: 0 }}>
              Extender licencia de <strong style={{ color: 'var(--text-dark, #fff)' }}>{extendModal.name}</strong>
            </p>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted, #888)', display: 'block', marginBottom: 4 }}>Días a extender</label>
              <input
                type="number"
                value={extendDays}
                onChange={e => setExtendDays(Math.max(1, Number(e.target.value)))}
                min={1}
                style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-main, #1c1c1c)', border: '1px solid var(--border-color, #333)', color: 'var(--text-dark, #fff)', fontSize: 13 }}
              />
            </div>
            <button
              onClick={handleExtend}
              disabled={actionLoading === extendModal.id}
              style={{
                padding: '10px', background: 'var(--color-orange-red, #f05a28)', color: '#fff',
                border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer', marginTop: 4,
              }}
            >
              {actionLoading === extendModal.id ? 'Extendiendo...' : 'Extender Licencia'}
            </button>
          </div>
        )}
      </Modal>

      <Modal open={!!planModal} onClose={() => setPlanModal(null)} title="Cambiar Plan">
        {planModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '8px 0' }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted, #888)', margin: 0 }}>
              Cambiar plan de <strong style={{ color: 'var(--text-dark, #fff)' }}>{planModal.name}</strong>
            </p>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted, #888)', display: 'block', marginBottom: 4 }}>Nuevo plan</label>
              <select
                value={newPlan}
                onChange={e => setNewPlan(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-main, #1c1c1c)', border: '1px solid var(--border-color, #333)', color: 'var(--text-dark, #fff)', fontSize: 13 }}
              >
                {PLAN_OPTIONS.map(p => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleChangePlan}
              disabled={actionLoading === planModal.id}
              style={{
                padding: '10px', background: 'var(--color-orange-red, #f05a28)', color: '#fff',
                border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer', marginTop: 4,
              }}
            >
              {actionLoading === planModal.id ? 'Cambiando...' : 'Cambiar Plan'}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
