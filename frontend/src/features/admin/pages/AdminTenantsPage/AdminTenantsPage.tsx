// src/features/admin/pages/AdminTenantsPage/AdminTenantsPage.tsx
import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, Plus, Minus } from 'lucide-react';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '@contexts/ToastContext';
import { useTheme } from '@contexts/ThemeContext';
import {
  Stack,
  Text,
  Button,
  Input,
  Select,
  Modal,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  Badge,
  Card
} from '@shared/ui';
import { SkeletonTable } from '@shared/ui/Skeleton';
import { api } from '@shared/lib/http/client';
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
      <Stack className={styles.container} gap="4">
        <Card className="textCenter p6 flex flexCol itemsCenter gap3">
          <AlertTriangle size={32} className="textDanger" />
          <Text variant="h2" className="fontWeightBold">Acceso restringido</Text>
          <Text className="textMuted">
            Solo los administradores pueden acceder al panel de gestión de licencias.
          </Text>
        </Card>
      </Stack>
    );
  }

  const planSelectOptions = PLAN_OPTIONS.map((p) => ({
    value: p,
    label: p.charAt(0).toUpperCase() + p.slice(1),
  }));

  return (
    <Stack className={styles.container} gap="4">
      <Stack direction="row" className="itemsCenter gap2">
        <Shield size={20} className="textPrimary" />
        <Text variant="h1" className="fontWeightBold">PANEL DE ADMINISTRACIÓN DE LICENCIAS</Text>
      </Stack>
      <Text className="textMuted styleItalic">Gestiona las licencias de todos los inquilinos del sistema.</Text>

      <Card>
        <Stack className="p4 borderBottom" direction="row" className="justifyBetween itemsCenter">
          <Text variant="h3" className="fontWeightSemiBold">EMPRESAS REGISTRADAS ({tenants.length})</Text>
        </Stack>

        {loading ? (
          <SkeletonTable rows={5} cols={6} />
        ) : tenants.length === 0 ? (
          <Text className="textMuted p5 styleItalic textCenter">No hay empresas registradas.</Text>
        ) : (
          <Stack className={styles.tableWrap}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Empresa</TableHeaderCell>
                  <TableHeaderCell>Plan</TableHeaderCell>
                  <TableHeaderCell>Estado</TableHeaderCell>
                  <TableHeaderCell>Vencimiento</TableHeaderCell>
                  <TableHeaderCell>Bloqueado</TableHeaderCell>
                  <TableHeaderCell className="textRight">Acciones</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tenants.map((t) => {
                  const isExpired = new Date(t.licenseExpiresAt) < new Date();
                  const isCanceled = t.subscriptionStatus === 'canceled';
                  const badgeVariant = t.planType === 'enterprise' ? 'purple' : t.planType === 'pro' ? 'warning' : 'neutral';
                  const statusVariant = isCanceled ? 'danger' : isExpired ? 'warning' : 'success';

                  return (
                    <TableRow key={t.id} className={t.isBlocked ? "opacity50" : ""}>
                      <TableCell className="fontWeightSemiBold">{t.name}</TableCell>
                      <TableCell>
                        <Badge variant={badgeVariant}>{t.planType}</Badge>
                      </TableCell>
                      <TableCell>
                        <Text className="fontMonospace fontWeightBold" variant={statusVariant}>
                          {isCanceled ? 'Cancelada' : isExpired ? 'Expirada' : 'Activa'}
                        </Text>
                      </TableCell>
                      <TableCell className="fontMonospace textMuted">{formatDate(t.licenseExpiresAt)}</TableCell>
                      <TableCell>
                        {t.isBlocked ? (
                          <XCircle size={16} className="textDanger" />
                        ) : (
                          <CheckCircle size={16} className="textSuccess" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" className="justifyEnd gap2 flexWrap">
                          {t.isBlocked ? (
                            <Button
                              variant="neutral"
                              onClick={() => handleUnblock(t.id)}
                              disabled={actionLoading === t.id}
                              className="flex itemsCenter gap1"
                            >
                              <CheckCircle size={13} /> Desbloquear
                            </Button>
                          ) : (
                            <Button
                              variant="danger"
                              onClick={() => handleBlock(t.id)}
                              disabled={actionLoading === t.id}
                              className="flex itemsCenter gap1"
                            >
                              <XCircle size={13} /> Bloquear
                            </Button>
                          )}
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setExtendModal({ id: t.id, name: t.name });
                              setExtendDays(30);
                            }}
                            className="flex itemsCenter gap1"
                          >
                            <Plus size={13} /> Extender
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setPlanModal({ id: t.id, name: t.name, currentPlan: t.planType });
                              setNewPlan(t.planType);
                            }}
                            className="flex itemsCenter gap1"
                          >
                            <Minus size={13} /> Plan
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Stack>
        )}
      </Card>

      <Modal open={!!extendModal} onClose={() => setExtendModal(null)} title="Extender Licencia">
        {extendModal && (
          <Stack gap="3" className="p2">
            <Text>
              Extender licencia de <Text as="strong" className="fontWeightBold">{extendModal.name}</Text>
            </Text>
            <Stack gap="1">
              <Text variant="label" className="textMuted">Días a extender</Text>
              <Input
                type="number"
                value={extendDays}
                onChange={(e) => setExtendDays(Math.max(1, Number(e.target.value)))}
                min={1}
              />
            </Stack>
            <Button
              onClick={handleExtend}
              disabled={actionLoading === extendModal.id}
              variant="primary"
              className="wFull"
            >
              {actionLoading === extendModal.id ? 'Extendiendo...' : 'Extender Licencia'}
            </Button>
          </Stack>
        )}
      </Modal>

      <Modal open={!!planModal} onClose={() => setPlanModal(null)} title="Cambiar Plan">
        {planModal && (
          <Stack gap="3" className="p2">
            <Text>
              Cambiar plan de <Text as="strong" className="fontWeightBold">{planModal.name}</Text>
            </Text>
            <Stack gap="1">
              <Text variant="label" className="textMuted">Nuevo plan</Text>
              <Select
                value={newPlan}
                onChange={(val) => setNewPlan(val)}
                options={planSelectOptions}
              />
            </Stack>
            <Button
              onClick={handleChangePlan}
              disabled={actionLoading === planModal.id}
              variant="primary"
              className="wFull"
            >
              {actionLoading === planModal.id ? 'Cambiando...' : 'Cambiar Plan'}
            </Button>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}