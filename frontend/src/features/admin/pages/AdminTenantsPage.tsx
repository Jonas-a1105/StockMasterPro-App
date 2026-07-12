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
  return new Date(d).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
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
  const [planModal, setPlanModal] = useState<{
    id: string;
    name: string;
    currentPlan: string;
  } | null>(null);
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
        <div className={`${styles.card} ${styles.accessDeniedCard}`}>
          <AlertTriangle size={32} className={styles.iconDanger} />
          <h2 className={styles.accessDeniedTitle}>Acceso restringido</h2>
          <p className={styles.accessDeniedText}>
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
          <SkeletonTable rows={5} cols={6} />
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
                  <th className={styles.actionsCol}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((t) => {
                  const isExpired = new Date(t.licenseExpiresAt) < new Date();
                  const isCanceled = t.subscriptionStatus === 'canceled';
                  const statusClass = isCanceled
                    ? styles.statusCanceled
                    : isExpired
                      ? styles.statusExpired
                      : styles.statusActive;
                  return (
                    <tr key={t.id} className={t.isBlocked ? styles.rowBlocked : ''}>
                      <td>
                        <div className={styles.cellName}>{t.name}</div>
                      </td>
                      <td>
                        <span
                          className={`${styles.badge} ${t.planType === 'enterprise' ? styles.badgeEnterprise : t.planType === 'pro' ? styles.badgePro : styles.badgeFree}`}
                        >
                          {t.planType}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${statusClass}`}>
                          {isCanceled ? 'Cancelada' : isExpired ? 'Expirada' : 'Activa'}
                        </span>
                      </td>
                      <td className={styles.cellDate}>{formatDate(t.licenseExpiresAt)}</td>
                      <td>
                        {t.isBlocked ? (
                          <XCircle size={16} className={styles.iconDanger} />
                        ) : (
                          <CheckCircle size={16} className={styles.iconSuccess} />
                        )}
                      </td>
                      <td className={styles.actionsCol}>
                        <div className={styles.actions}>
                          {t.isBlocked ? (
                            <button
                              className={styles.actionBtn}
                              onClick={() => handleUnblock(t.id)}
                              disabled={actionLoading === t.id}
                              title="Desbloquear"
                            >
                              <CheckCircle size={13} /> Desbloquear
                            </button>
                          ) : (
                            <button
                              className={`${styles.actionBtn} ${styles.actionDanger}`}
                              onClick={() => handleBlock(t.id)}
                              disabled={actionLoading === t.id}
                              title="Bloquear"
                            >
                              <XCircle size={13} /> Bloquear
                            </button>
                          )}
                          <button
                            className={styles.actionBtn}
                            onClick={() => {
                              setExtendModal({ id: t.id, name: t.name });
                              setExtendDays(30);
                            }}
                            title="Extender licencia"
                          >
                            <Plus size={13} /> Extender
                          </button>
                          <button
                            className={styles.actionBtn}
                            onClick={() => {
                              setPlanModal({ id: t.id, name: t.name, currentPlan: t.planType });
                              setNewPlan(t.planType);
                            }}
                            title="Cambiar plan"
                          >
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
          <div className={styles.modalForm}>
            <p className={styles.modalFormText}>
              Extender licencia de{' '}
              <strong className={styles.modalFormStrong}>{extendModal.name}</strong>
            </p>
            <div>
              <label className={styles.modalFormLabel}>Días a extender</label>
              <input
                type="number"
                value={extendDays}
                onChange={(e) => setExtendDays(Math.max(1, Number(e.target.value)))}
                min={1}
                className={styles.modalFormInput}
              />
            </div>
            <button
              onClick={handleExtend}
              disabled={actionLoading === extendModal.id}
              className={styles.modalFormBtn}
            >
              {actionLoading === extendModal.id ? 'Extendiendo...' : 'Extender Licencia'}
            </button>
          </div>
        )}
      </Modal>

      <Modal open={!!planModal} onClose={() => setPlanModal(null)} title="Cambiar Plan">
        {planModal && (
          <div className={styles.modalForm}>
            <p className={styles.modalFormText}>
              Cambiar plan de <strong className={styles.modalFormStrong}>{planModal.name}</strong>
            </p>
            <div>
              <label className={styles.modalFormLabel}>Nuevo plan</label>
              <select
                value={newPlan}
                onChange={(e) => setNewPlan(e.target.value)}
                className={styles.modalFormInput}
              >
                {PLAN_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleChangePlan}
              disabled={actionLoading === planModal.id}
              className={styles.modalFormBtn}
            >
              {actionLoading === planModal.id ? 'Cambiando...' : 'Cambiar Plan'}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
