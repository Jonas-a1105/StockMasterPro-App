import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  DollarSign,
  Percent,
  Coins,
  Eye,
  RefreshCw,
  Store,
  Download,
  Upload,
  RotateCcw,
  Palette,
  Square,
  Sparkles,
  Save,
  Trash2,
  Cloud,
  History,
  FileDown,
  FileUp,
  FileCode,
  BellRing,
  Inbox,
  Sliders,
  TriangleAlert,
  MessageSquare,
  Monitor,
  Mail,
  Globe,
  Settings,
  Server,
  HardDrive,
  Download as DownloadIcon,
  X,
  Pause,
  Trash2 as Trash,
  Loader2,
  CheckCircle,
  ClipboardList,
  Search,
  ShieldCheck,
  Users,
  Activity,
  PieChart,
  Shield,
  Edit2,
  ToggleRight,
  ToggleLeft,
  MapPin,
  Building2,
  Plus,
  Warehouse,
} from 'lucide-react';
import { api } from '@shared/lib/http/client';
import { useToast } from '@contexts/ToastContext';
import { useExchangeRate } from '@contexts/ExchangeRateContext';
import { useTheme } from '@contexts/ThemeContext';
import { useAuth } from '@contexts/AuthContext';

import { PremiumActivationAnimation } from '@features/billing/components/PremiumActivationAnimation';
import { UsageMeter } from '@features/settings/components/UsageMeter';
import { PremiumLockButton } from '@features/billing/components/PremiumLockButton';
import { PremiumLockScreen } from '@features/billing/components/PremiumLockScreen';
import { Lock } from 'lucide-react';
import { SkeletonTablePage, SkeletonForm, SkeletonTable } from '@shared/ui/Skeleton';
import { StripeCheckoutModal } from '@features/billing/components/StripeCheckoutModal';
import { CreditCard as CardIcon } from 'lucide-react';
import styles from './SettingsPage.module.css';
import tableStyles from '@shared/ui/TableList/TableList.module.css';
import { SessionsTab } from '../components/SessionsTab';
import { Toolbar } from '@shared/ui';
import { DataTable } from '@shared/ui';
import { Badge } from '@shared/ui/Badge';
import { Modal } from '@shared/ui/Modal';
import { FormField } from '@shared/ui/FormField';
import { Input } from '@shared/ui/Input';
import { Button } from '@shared/ui/Button';
import { ButtonLoader } from '@shared/ui/ButtonLoader';

type Tab =
  | 'tax-currency'
  | 'personalization'
  | 'branches'
  | 'backup'
  | 'notifications'
  | 'downloads'
  | 'bitacora'
  | 'licenses'
  | 'sessions';

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: 'tax-currency', label: 'Impuestos y moneda', icon: DollarSign },
  { key: 'personalization', label: 'Personalización', icon: Palette },
  { key: 'branches', label: 'Sucursales', icon: MapPin },
  { key: 'backup', label: 'Respaldo', icon: HardDrive },
  { key: 'notifications', label: 'Notificaciones', icon: BellRing },
  { key: 'downloads', label: 'Gestor de descargas', icon: HardDrive },
  { key: 'bitacora', label: 'Bitácora', icon: ClipboardList },
  { key: 'licenses', label: 'Licencias', icon: ShieldCheck },
  { key: 'sessions', label: 'Sesiones', icon: Monitor },
];

const LS_KEYS = {
  taxRate: 'stockmaster-tax-rate',
  taxName: 'stockmaster-tax-name',
  currencySymbol: 'stockmaster-currency-symbol',
  currencyPosition: 'stockmaster-currency-position',
  decimalPlaces: 'stockmaster-decimal-places',
} as const;

const DEFAULTS = {
  taxRate: '16',
  taxName: 'IVA',
  currencySymbol: 'Bs',
  currencyPosition: 'before',
  decimalPlaces: '2',
};

function readStorage(key: string, fallback: string): string {
  return localStorage.getItem(key) ?? fallback;
}

export function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { licenseStatus, isAuthenticated, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const tabParam = searchParams.get('tab') as Tab;
  const defaultTab: Tab =
    tabParam && TABS.some((t) => t.key === tabParam) ? tabParam : 'tax-currency';
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);

  useEffect(() => {
    const currentTabParam = searchParams.get('tab') as Tab;
    if (
      currentTabParam &&
      TABS.some((t) => t.key === currentTabParam) &&
      currentTabParam !== activeTab
    ) {
      setActiveTab(currentTabParam);
    }
  }, [searchParams]);

  const handleTabChange = (key: Tab) => {
    setActiveTab(key);
    setSearchParams({ tab: key });
  };

  const isTabLocked = (tabKey: Tab) => {
    if (licenseStatus?.tier === 'free') {
      return ['personalization', 'branches', 'backup'].includes(tabKey);
    }
    return false;
  };

  const handleSave = () => {
    showToast('Configuración guardada correctamente', 'success');
  };

  return (
    <div className={styles.container}>
      <div className={styles.contentBody}>
        <nav className={styles.tabsContainer}>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const locked = isTabLocked(tab.key);
            return (
              <button
                key={tab.key}
                className={`${styles.tabBtn} ${activeTab === tab.key ? styles.tabBtnActive : ''} ${locked ? styles.tabBtnLocked : ''}`}
                onClick={() => handleTabChange(tab.key)}
              >
                <Icon size={22} />
                <span>{tab.label}</span>
                {locked && <Lock size={12} className={styles.iconPrimary} />}
              </button>
            );
          })}
        </nav>

        {activeTab === 'tax-currency' && <TaxCurrencyTab />}
        {activeTab === 'personalization' &&
          (licenseStatus?.tier === 'free' ? (
            <PremiumLockScreen requiredPlan="pro" sectionName="Personalización Visual" />
          ) : (
            <PersonalizationTab />
          ))}
        {activeTab === 'branches' &&
          (licenseStatus?.tier === 'free' ? (
            <PremiumLockScreen requiredPlan="pro" sectionName="Gestión de Sucursales" />
          ) : (
            <BranchesTab />
          ))}
        {activeTab === 'backup' &&
          (licenseStatus?.tier === 'free' ? (
            <PremiumLockScreen requiredPlan="pro" sectionName="Respaldo de Datos" />
          ) : (
            <BackupTab />
          ))}
        {activeTab === 'notifications' && <NotificationsTab />}
        {activeTab === 'downloads' && <DownloadsTab />}
        {activeTab === 'bitacora' && <BitacoraTab />}
        {activeTab === 'licenses' && <LicensesTab />}
        {activeTab === 'sessions' && <SessionsTab />}
      </div>

      <div className={styles.stickyActionBar}>
        <button className={styles.btnFlatSecondary}>Descartar</button>
        <button className={styles.btnFlatPrimary} onClick={handleSave}>
          <Save size={14} /> Guardar cambios
        </button>
      </div>
    </div>
  );
}

function TaxCurrencyTab() {
  const { config, updateConfig } = useExchangeRate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [taxRate, setTaxRate] = useState('');
  const [taxName, setTaxName] = useState('');
  const [currencySymbol, setCurrencySymbol] = useState('');
  const [currencyPosition, setCurrencyPosition] = useState<'before' | 'after'>('before');
  const [decimalPlaces, setDecimalPlaces] = useState(2);
  const [displayCurrency, setDisplayCurrency] = useState<'bs' | 'usd' | 'both'>('both');
  const [companyTaxId, setCompanyTaxId] = useState('');
  const [companyFiscalAddress, setCompanyFiscalAddress] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const settings = await api.getTenantSettings();
      setTaxRate(String(settings.taxRate ?? 16));
      setTaxName(settings.taxName ?? 'IVA');
      setCurrencySymbol(settings.currencySymbol ?? 'Bs');
      setCurrencyPosition(settings.currencyPosition ?? 'before');
      setDecimalPlaces(settings.decimalPlaces ?? 2);
      setDisplayCurrency(settings.displayCurrency ?? 'both');
      setCompanyTaxId(settings.companyTaxId ?? '');
      setCompanyFiscalAddress(settings.companyFiscalAddress ?? '');
      setCompanyPhone(settings.companyPhone ?? '');
      updateConfig({
        symbol: settings.currencySymbol ?? 'Bs',
        position: settings.currencyPosition ?? 'before',
        decimals: settings.decimalPlaces ?? 2,
        displayCurrency: settings.displayCurrency ?? 'both',
      });
    } catch (err: any) {
      showToast(err.message || 'Error al cargar configuración', 'error');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await api.updateTenantSettings({
        taxRate: Number(taxRate),
        taxName,
        currencySymbol,
        currencyPosition,
        decimalPlaces,
        displayCurrency,
        companyTaxId,
        companyFiscalAddress,
        companyPhone,
      });
      showToast('Configuración guardada', 'success');
      updateConfig({
        symbol: currencySymbol,
        position: currencyPosition,
        decimals: decimalPlaces,
        displayCurrency,
      });
    } catch (err: any) {
      showToast(err.message || 'Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const resetDefaults = () => {
    setTaxRate('16');
    setTaxName('IVA');
    setCurrencySymbol('Bs');
    setCurrencyPosition('before');
    setDecimalPlaces(2);
    setDisplayCurrency('both');
  };

  if (loading) return <SkeletonForm />;

  return (
    <div className={styles.bentoGrid}>
      {/* Tarjeta: Configuración de Impuestos */}
      <div className={styles.bentoCard}>
        <div className={styles.bentoCardHeader}>
          <Percent size={22} />
          <h2 className={styles.bentoCardTitle}>Configuración de impuestos</h2>
        </div>
        <div className={styles.formGroupLayout}>
          <div className={styles.formGroup}>
            <label className={styles.fieldLabel}>Nombre del impuesto</label>
            <input
              type="text"
              className={styles.formControl}
              value={taxName}
              onChange={(e) => setTaxName(e.target.value)}
              placeholder="IVA"
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.fieldLabel}>Tasa de impuesto</label>
            <div className={styles.inputWrapper}>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                className={`${styles.formControl} ${styles.paddingRightLarge}`}
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                placeholder="16"
              />
              <div className={styles.inputAddon}>%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjeta: Formato de Moneda */}
      <div className={styles.bentoCard}>
        <div className={styles.bentoCardHeader}>
          <Coins size={22} />
          <h2 className={styles.bentoCardTitle}>Formato de moneda</h2>
        </div>
        <div className={styles.formGroupLayout}>
          <div className={styles.formGroup}>
            <label className={styles.fieldLabel}>Símbolo de moneda</label>
            <input
              type="text"
              className={styles.formControl}
              value={currencySymbol}
              onChange={(e) => setCurrencySymbol(e.target.value)}
              placeholder="Bs"
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.fieldLabel}>Posición del símbolo</label>
            <select
              className={styles.formControl}
              value={currencyPosition}
              onChange={(e) => setCurrencyPosition(e.target.value as 'before' | 'after')}
            >
              <option value="before">Antes del monto (Bs 100)</option>
              <option value="after">Después del monto (100 Bs)</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.fieldLabel}>Decimales</label>
            <select
              className={styles.formControl}
              value={decimalPlaces}
              onChange={(e) => setDecimalPlaces(Number(e.target.value))}
            >
              <option value="0">0 (100)</option>
              <option value="2">2 (100.00)</option>
              <option value="3">3 (100.000)</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.fieldLabel}>Moneda a mostrar</label>
            <select
              className={styles.formControl}
              value={displayCurrency}
              onChange={(e) => setDisplayCurrency(e.target.value as 'bs' | 'usd' | 'both')}
            >
              <option value="both">Ambas monedas ($ y Bs)</option>
              <option value="local">Solo moneda local (Bs)</option>
              <option value="usd">Solo dólares ($)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tarjeta: Datos Fiscales del Negocio */}
      <div className={styles.bentoCard}>
        <div className={styles.bentoCardHeader}>
          <Building2 size={22} />
          <h2 className={styles.bentoCardTitle}>Datos fiscales del negocio</h2>
        </div>
        <div className={styles.formGroupLayout}>
          <div className={styles.formGroup}>
            <label className={styles.fieldLabel}>RIF de la empresa</label>
            <input
              type="text"
              className={styles.formControl}
              value={companyTaxId}
              onChange={(e) => setCompanyTaxId(e.target.value)}
              placeholder="J-12345678-9"
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.fieldLabel}>Teléfono</label>
            <input
              type="text"
              className={styles.formControl}
              value={companyPhone}
              onChange={(e) => setCompanyPhone(e.target.value)}
              placeholder="+58 4XX XXX XXXX"
            />
          </div>
          <div className={`${styles.formGroup} ${styles.gridColFull}`}>
            <label className={styles.fieldLabel}>Dirección fiscal</label>
            <input
              type="text"
              className={styles.formControl}
              value={companyFiscalAddress}
              onChange={(e) => setCompanyFiscalAddress(e.target.value)}
              placeholder="Av. Principal, Edificio, Oficina, Ciudad"
            />
          </div>
        </div>
      </div>

      {/* Tarjeta: Visualización en tiempo real */}
      <div className={`${styles.bentoCard} ${styles.bentoWide}`}>
        <div className={styles.bentoCardHeader}>
          <Eye size={22} />
          <h2 className={styles.bentoCardTitle}>Visualización en tiempo real</h2>
        </div>
        <div className={styles.formGroup}>
          <label className={`${styles.fieldLabel} ${styles.mb8}`}>Vista previa (Bolívares)</label>
          <div>
            <div className={styles.previewBox}>
              {currencyPosition === 'before'
                ? `${currencySymbol} 1,234${decimalPlaces !== 0 ? ',' + '0'.repeat(decimalPlaces) : ''}`
                : `1,234${decimalPlaces !== 0 ? ',' + '0'.repeat(decimalPlaces) : ''} ${currencySymbol}`}
            </div>
          </div>
        </div>
        <div className={styles.cardFooterActions}>
          <button className={styles.btnLink} onClick={resetDefaults}>
            <RefreshCw size={13} /> Restablecer valores
          </button>
          <button className={styles.btnFlatPrimary} onClick={saveSettings} disabled={saving}>
            {saving ? (
              'Guardando...'
            ) : (
              <>
                <Save size={14} /> Guardar cambios
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===========================================
   PERSONALIZATION TAB
   =========================================== */

function PersonalizationTab() {
  const { config, updateConfig, toggleDarkMode, toggleOledMode, resetTheme } = useTheme();

  return (
    <div className={styles.bentoGrid}>
      {/* Tarjeta: Modo de Visualización */}
      <div className={styles.bentoCard}>
        <div className={styles.bentoCardHeader}>
          <Palette size={22} />
          <h2 className={styles.bentoCardTitle}>Modo de visualización</h2>
        </div>
        <div className={styles.toggleRow}>
          <span className={styles.pFieldLabel}>Modo oscuro</span>
          <button
            className={`${styles.pToggle} ${config.darkMode ? styles.pToggleOn : ''}`}
            onClick={toggleDarkMode}
          >
            <span className={styles.pToggleKnob} />
          </button>
        </div>
        <div className={`${styles.toggleRow} ${styles.mt8}`}>
          <span className={styles.pFieldLabel}>Modo OLED</span>
          <button
            className={`${styles.pToggle} ${config.oledMode ? styles.pToggleOn : ''}`}
            onClick={toggleOledMode}
          >
            <span className={styles.pToggleKnob} />
          </button>
        </div>
        <div className={`${styles.toggleRow} ${styles.mt8}`}>
          <span className={styles.pFieldLabel}>Bordes en tarjetas</span>
          <button
            className={`${styles.pToggle} ${config.cardBorders ? styles.pToggleOn : ''}`}
            onClick={() => updateConfig({ cardBorders: !config.cardBorders })}
          >
            <span className={styles.pToggleKnob} />
          </button>
        </div>
        <div className={`${styles.toggleRow} ${styles.mt8}`}>
          <span className={styles.pFieldLabel}>Sombras globales</span>
          <button
            className={`${styles.pToggle} ${config.shadows ? styles.pToggleOn : ''}`}
            onClick={() => updateConfig({ shadows: !config.shadows })}
          >
            <span className={styles.pToggleKnob} />
          </button>
        </div>
      </div>

      {/* Tarjeta: Bordes Redondeados */}
      <div className={styles.bentoCard}>
        <div className={styles.bentoCardHeader}>
          <Square size={22} />
          <h2 className={styles.bentoCardTitle}>Radio de bordes</h2>
        </div>
        <div className={styles.sliderRow}>
          <label className={styles.pFieldLabel}>Radio de bordes global</label>
          <div className={styles.sliderGroup}>
            <input
              type="range"
              className={styles.pSlider}
              min={0}
              max={24}
              step={1}
              value={config.cardRadius !== undefined ? config.cardRadius : 12}
              onChange={(e) => {
                const r = parseInt(e.target.value, 10);
                updateConfig({ cardRadius: r });
              }}
            />
            <span className={styles.sliderValue}>{config.cardRadius !== undefined ? config.cardRadius : 12}px</span>
          </div>
        </div>
      </div>

      {/* Tarjeta: Sombras */}
      <div className={styles.bentoCard}>
        <div className={styles.bentoCardHeader}>
          <Sparkles size={22} />
          <h2 className={styles.bentoCardTitle}>Sombras</h2>
        </div>
        <div className={styles.toggleRow}>
          <span className={styles.pFieldLabel}>Sombras activadas</span>
          <button
            className={`${styles.pToggle} ${config.shadows ? styles.pToggleOn : ''}`}
            onClick={() => updateConfig({ shadows: !config.shadows })}
          >
            <span className={styles.pToggleKnob} />
          </button>
        </div>
      </div>

      {/* Tarjeta: Microinteracciones */}
      <div className={styles.bentoCard}>
        <div className={styles.bentoCardHeader}>
          <Sparkles size={22} />
          <h2 className={styles.bentoCardTitle}>Microinteracciones</h2>
        </div>
        <div className={styles.toggleRow}>
          <span className={styles.pFieldLabel}>Animaciones y transiciones</span>
          <button
            className={`${styles.pToggle} ${config.animationEnabled ? styles.pToggleOn : ''}`}
            onClick={() => updateConfig({ animationEnabled: !config.animationEnabled })}
          >
            <span className={styles.pToggleKnob} />
          </button>
        </div>
      </div>

      {/* Acciones Globales */}
      <div className={styles.bentoCard}>
        <div className={styles.bentoCardHeader}>
          <RotateCcw size={22} />
          <h2 className={styles.bentoCardTitle}>Acciones</h2>
        </div>
        <button className={styles.resetThemeBtn} onClick={resetTheme}>
          <RotateCcw size={14} />
          Restaurar valores predeterminados
        </button>
      </div>
    </div>
  );
}

/* ===========================================
   BRANCHES TAB (unchanged)
   =========================================== */

function BranchesTab() {
  const { showToast } = useToast();
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ type: 'create' | 'edit'; data?: any } | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await api.get('/warehouses');
      setWarehouses(data);
    } catch (err: any) {
      showToast(err.message || 'Error al cargar almacenes', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(data: any) {
    try {
      await api.post('/warehouses', data);
      showToast('Almacén creado', 'success');
      setModal(null);
      load();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  }

  async function handleUpdate(id: string, data: any) {
    try {
      await api.put(`/warehouses/${id}`, data);
      showToast('Almacén actualizado', 'success');
      setModal(null);
      load();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar almacén "${name}"? Los productos se desvincularán.`)) return;
    try {
      await api.delete(`/warehouses/${id}`);
      showToast('Almacén eliminado', 'success');
      load();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  }

  async function toggleActive(w: any) {
    try {
      await api.put(`/warehouses/${w.id}`, { isActive: !w.isActive });
      showToast(w.isActive ? 'Almacén desactivado' : 'Almacén activado', 'success');
      load();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  }

  return (
    <div className={styles.warehouseSection}>
      <div className={styles.warehouseHeader}>
        <h3>Gestión de Sucursales</h3>
        <button className={styles.btn} onClick={() => setModal({ type: 'create' })}>
          <Store size={16} /> Nueva Sucursal
        </button>
      </div>

      {loading ? (
        <SkeletonTable rows={3} cols={4} />
      ) : warehouses.length === 0 ? (
        <div className={styles.emptyState}>
          <Store size={40} className={styles.emptyIcon} />
          <p>No hay sucursales registradas. Crea la primera.</p>
        </div>
      ) : (
        <div className={tableStyles.container}>
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Código</th>
                <th>Dirección</th>
                <th className={styles.textCenter}>Estado</th>
                <th className={styles.textCenter}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {warehouses.map((w) => (
                <tr key={w.id}>
                  <td>
                    <div className={tableStyles.nameCell}>
                      <Store size={14} className={styles.iconAccent} />
                      <span className={tableStyles.nameText}>{w.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className={tableStyles.code}>{w.code}</span>
                  </td>
                  <td className={styles.textMuted}>{w.address || '—'}</td>
                  <td className={styles.textCenter}>
                    <span
                      className={`${tableStyles.badge} ${w.isActive ? tableStyles.badgeActive : tableStyles.badgeInactive}`}
                    >
                      {w.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className={styles.textCenter}>
                    <div className={`${tableStyles.actions} ${styles.flexCenter}`}>
                      <button
                        className={tableStyles.actionBtn}
                        onClick={() => setModal({ type: 'edit', data: w })}
                        title="Editar"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className={tableStyles.actionBtn}
                        onClick={() => toggleActive(w)}
                        title={w.isActive ? 'Desactivar' : 'Activar'}
                      >
                        {w.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                      </button>
                      <button
                        className={`${tableStyles.actionBtn} danger`}
                        onClick={() => handleDelete(w.id, w.name)}
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <WarehouseModal
          type={modal.type}
          data={modal.data}
          onSave={
            modal.type === 'create' ? handleCreate : (d: any) => handleUpdate(modal.data.id, d)
          }
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

function WarehouseModal({
  type,
  data,
  onSave,
  onClose,
}: {
  type: string;
  data?: any;
  onSave: (d: any) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(data?.name || '');
  const [code, setCode] = useState(data?.code || '');
  const [address, setAddress] = useState(data?.address || '');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;
    setSaving(true);
    await onSave({ name: name.trim(), code: code.trim(), address: address.trim() || undefined });
    setSaving(false);
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3>{type === 'create' ? 'Nueva Sucursal' : 'Editar Sucursal'}</h3>
        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label>Nombre *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ej: Sucursal Centro"
            />
          </div>
          <div className={styles.field}>
            <label>Código *</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              placeholder="Ej: SUC-001"
            />
          </div>
          <div className={styles.field}>
            <label>Dirección</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Opcional"
            />
          </div>
          <div className={styles.modalActions}>
            <button type="button" className={styles.btnSecondary} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className={styles.btn} disabled={saving}>
              {saving ? 'Guardando...' : type === 'create' ? 'Crear' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function NotificationsTab() {
  const [activeNotifTab, setActiveNotifTab] = useState<
    'todo' | 'sistema' | 'soporte' | 'seguridad'
  >('todo');
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      type: 'critical' | 'success' | 'info';
      title: string;
      description: string;
      time: string;
      category: string;
      unread: boolean;
    }>
  >([]);
  const [channels, setChannels] = useState({ push: true, email: true, webhook: false });

  useEffect(() => {
    api
      .getNotifications()
      .then((data) => {
        setNotifications(data);
        setUnreadCount(data.filter((n: any) => n.unread).length);
      })
      .catch(() => {});
  }, []);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    setUnreadCount(0);
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const filteredNotifs =
    activeNotifTab === 'todo'
      ? notifications
      : notifications.filter((n) => n.category.toLowerCase() === activeNotifTab);

  const notifIconMap: Record<string, any> = {
    critical: TriangleAlert,
    success: Cloud,
    info: MessageSquare,
  };

  return (
    <div className={styles.notifContainer}>
      <div className={styles.backupHeader}>
        <h3>Orquestador de Alertas Centralizadas</h3>
        <p>
          Ecosistema modular de auditoría de registros, eventos del sistema y entrega de
          notificaciones.
        </p>
      </div>

      <div className={styles.notifGrid}>
        {/* TARJETA 1: BANDEJA DE ENTRADA (SPAN 2) */}
        <div className={`${styles.notifCard} ${styles.notifCardDouble}`}>
          <div className={styles.notifCardHeader}>
            <div className={styles.backupCardTitle}>
              <Inbox size={16} />
              Bandeja de Entrada
            </div>
            <button className={styles.notifMarkAllBtn} onClick={markAllAsRead}>
              Marcar todas como leídas
            </button>
          </div>

          <div className={styles.notifTabs}>
            {(['todo', 'sistema', 'soporte', 'seguridad'] as const).map((tab) => (
              <button
                key={tab}
                className={`${styles.notifTab} ${activeNotifTab === tab ? styles.notifTabActive : ''}`}
                onClick={() => setActiveNotifTab(tab)}
              >
                {tab === 'todo' ? 'Todo' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === 'todo' && unreadCount > 0 && (
                  <span className={styles.notifTabBadge}>{unreadCount}</span>
                )}
              </button>
            ))}
          </div>

          <div className={styles.notifFeed}>
            {filteredNotifs.map((n) => {
              const Icon = notifIconMap[n.type];
              return (
                <div
                  key={n.id}
                  className={`${styles.notifItem} ${styles[`notif${n.type.charAt(0).toUpperCase() + n.type.slice(1)}`]} ${n.unread ? styles.notifUnread : ''}`}
                  onClick={() => n.unread && markAsRead(n.id)}
                >
                  <div className={styles.notifIconBox}>
                    <Icon size={15} />
                  </div>
                  <div className={styles.notifContent}>
                    <span className={styles.notifHeadline}>{n.title}</span>
                    <span className={styles.notifDesc}>{n.description}</span>
                    <span className={styles.notifTime}>
                      {n.time} • {n.category}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TARJETA 2: REGLAS DE DISTRIBUCIÓN */}
        <div className={styles.notifCard}>
          <div className={styles.backupCardTitle}>
            <Sliders size={16} />
            Reglas de Distribución
          </div>

          <div className={styles.notifMetrics}>
            <div className={styles.notifMetricTile}>
              <span className={styles.notifMetricLabel}>No leídas</span>
              <span className={`${styles.notifMetricValue} ${styles.colorPrimary}`}>
                {unreadCount}
              </span>
            </div>
            <div className={styles.notifMetricTile}>
              <span className={styles.notifMetricLabel}>Entregadas hoy</span>
              <span className={styles.notifMetricValue}>{notifications.length}</span>
            </div>
          </div>

          <div className={styles.notifChannelList}>
            <span className={styles.backupFieldLabel}>Canales Activos</span>
            <div className={styles.notifChannelRow}>
              <div className={styles.notifChannelInfo}>
                <Monitor size={16} /> Push en el navegador
              </div>
              <button
                className={`${styles.pToggle} ${channels.push ? styles.pToggleOn : ''}`}
                onClick={() => setChannels({ ...channels, push: !channels.push })}
              >
                <span className={styles.pToggleKnob} />
              </button>
            </div>
            <div className={styles.notifChannelRow}>
              <div className={styles.notifChannelInfo}>
                <Mail size={16} /> Alertas por email
              </div>
              <button
                className={`${styles.pToggle} ${channels.email ? styles.pToggleOn : ''}`}
                onClick={() => setChannels({ ...channels, email: !channels.email })}
              >
                <span className={styles.pToggleKnob} />
              </button>
            </div>
            <div className={styles.notifChannelRow}>
              <div className={styles.notifChannelInfo}>
                <Globe size={16} /> Retransmisión por Webhooks
              </div>
              <button
                className={`${styles.pToggle} ${channels.webhook ? styles.pToggleOn : ''}`}
                onClick={() => setChannels({ ...channels, webhook: !channels.webhook })}
              >
                <span className={styles.pToggleKnob} />
              </button>
            </div>
          </div>

          <button className={styles.backupBtnPrimary}>
            <Settings size={16} />
            Configurar Canales
          </button>
        </div>
      </div>
    </div>
  );
}

function DownloadsTab() {
  const { showToast } = useToast();
  const { licenseStatus } = useAuth();
  const currentPlan = licenseStatus?.tier || 'free';
  const [bandwidthLimit, setBandwidthLimit] = useState(100);
  const [concurrentDownloads, setConcurrentDownloads] = useState('4');
  const [cdnMirror, setCdnMirror] = useState('auto');
  const [downloadPath, setDownloadPath] = useState('/var/www/data/downloads/secure_stack');

  const [activeDownloads, setActiveDownloads] = useState([
    {
      id: 1,
      name: 'ubuntu-26.04-desktop-amd64.iso',
      source: 'mirror_core_us',
      downloaded: 2.1,
      total: 4.6,
      speed: 32.4,
      status: 'downloading',
      progress: 45,
      icon: 'file-zipper',
    },
    {
      id: 2,
      name: 'node_modules_production_backup.tar.gz',
      source: 'local_storage',
      downloaded: 840,
      total: 900,
      speed: 15.8,
      status: 'downloading',
      progress: 93,
      icon: 'box-archive',
    },
  ]);

  const [history, setHistory] = useState([
    {
      id: 1,
      category: 'Imágenes',
      name: 'asset_pack_marketing_v2.zip',
      completed: 'Completado ayer • 412 MB • Verificado por MD5',
    },
    {
      id: 2,
      category: 'Software',
      name: 'docker-compose-production-stack.yml',
      completed: 'Completado 29 Jun, 2026 • 18 KB • Cifrado AES',
    },
  ]);

  const handleBandwidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBandwidthLimit(Number(e.target.value));
  };

  const pauseAll = () => {
    showToast('Todas las descargas han sido pausadas', 'info');
  };

  const pauseDownload = (id: number) => {
    setActiveDownloads((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, status: d.status === 'paused' ? 'downloading' : 'paused' } : d
      )
    );
    showToast('Descarga pausada', 'info');
  };

  const cancelDownload = (id: number) => {
    setActiveDownloads((prev) => prev.filter((d) => d.id !== id));
    showToast('Descarga cancelada', 'info');
  };

  const openLocation = (_id: number) => {
    showToast('Abriendo ubicación del archivo', 'info');
  };

  const removeFromHistory = (id: number) => {
    setHistory((prev) => prev.filter((h) => h.id !== id));
    showToast('Registro eliminado del historial', 'info');
  };

  const applySettings = () => {
    showToast('Configuración guardada e implementada en el motor de descargas', 'success');
  };

  function getDownloadIcon(name: string) {
    if (name.match(/\.(zip|rar|7z)/i)) return FileDown;
    if (name.match(/\.(iso|img)/i)) return DownloadIcon;
    if (name.match(/\.(mp4|mkv|avi|mov)/i)) return DownloadIcon;
    if (name.match(/\.(pdf|doc|docx)/i)) return DownloadIcon;
    if (name.match(/\.(tar\.gz|tgz|gz)/i)) return DownloadIcon;
    return FileDown;
  }

  return (
    <div className={styles.downloadContainer}>
      <div className={styles.backupHeader}>
        <h3>Gestor de Descargas Globales</h3>
        <p>
          Ecosistema escalable de descarga paralela orientada a servidores y almacenamiento masivo.
        </p>
      </div>

      <div className={styles.downloadGrid}>
        {/* TARJETA: ACTUALIZACIÓN DETECTADA (SPAN 2) */}
        <div className={`${styles.downloadCard} ${styles.downloadCardDouble}`}>
          <div className={styles.backupCardTitle}>
            <DownloadIcon size={16} />
            Distribución de Software y Núcleo
          </div>
          <div className={styles.updateAlertBox}>
            <div className={`${styles.flexBetween} ${styles.flexWrap} ${styles.gap10}`}>
              <span className={styles.updateVersionTag}>Nueva actualización detectada</span>
              <span
                className={`${styles.fontSize12} ${styles.fontWeight700} ${styles.colorPrimary}`}
              >
                Tamaño: 2.4 GB
              </span>
            </div>
            <div className={styles.updateInfoTitle}>Versión Estable del Core v2.4.0</div>
            <p className={styles.updateChangelog}>
              • Optimización del rendimiento de la base de datos paralela en un 25%.
              <br />
              • Parche crítico de seguridad para la validación de firmas de paquetes distribuidos.
              <br />• Soporte ampliado para módulos modulares Bento Grid y renderizado plano
              escalable.
            </p>
          </div>
          <div className={styles.btnGroupRow}>
            <button
              className={`${styles.backupBtnSecondary} ${styles.btnHalf}`}
              onClick={() => showToast('Se te recordará en 24 horas', 'info')}
            >
              Descargar más tarde
            </button>
            <button
              className={`${styles.backupBtnPrimary} ${styles.btnHalf}`}
              onClick={() => showToast('Iniciando descarga de v2.4.0...', 'success')}
            >
              <DownloadIcon size={16} />
              Descargar ahora
            </button>
          </div>
        </div>

        {/* TARJETA: ESTADO DEL ENTORNO */}
        <div className={`${styles.downloadCard} ${styles.relative}`}>
          {currentPlan === 'free' && (
            <div className={styles.absFullOverlay}>
              <PremiumLockButton
                requiredPlan="intermedio"
                label="Bloqueado"
                sublabel="Mantén pulsado para Intermedio"
                width="90%"
                height="40px"
              />
            </div>
          )}
          <div className={styles.backupCardTitle}>
            <Server size={16} />
            Estado del Entorno
          </div>
          <div className={`${styles.metaGrid} ${styles.metaGridSingle}`}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Versión Actual</span>
              <span className={styles.metaValue}>v2.3.9-build_stable</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Último Análisis de Integridad</span>
              <span className={`${styles.metaValue} ${styles.colorSuccess}`}>
                <CheckCircle size={14} /> Correcto
              </span>
            </div>
          </div>
          <p className={`${styles.updateChangelog} ${styles.fontSize12}`}>
            El sistema está configurado para escalar dinámicamente según la carga de descarga
            concurrente asignada.
          </p>
        </div>

        {/* TARJETA: MÉTRICAS Y VELOCIDAD DE RED */}
        <div className={`${styles.downloadCard} ${styles.relative}`}>
          {currentPlan === 'free' && (
            <div
              className={`${styles.absolute} ${styles.inset0} ${styles.bgOverlay} ${styles.flexCenter} ${styles.p16} ${styles.z10}`}
            >
              <PremiumLockButton
                requiredPlan="intermedio"
                label="Bloqueado"
                sublabel="Mantén pulsado para Intermedio"
                width="90%"
                height="40px"
              />
            </div>
          )}
          <div className={styles.networkStats}>
            <div className={styles.statBlock}>
              <span className={styles.statLabel}>Velocidad Global</span>
              <div className={`${styles.statValue} ${styles.activeGreen}`}>48.2 MB/s</div>
            </div>
            <div className={styles.statBlock}>
              <span className={styles.statLabel}>Tareas en Curso</span>
              <div className={styles.statValue}>{activeDownloads.length} Activas</div>
            </div>
          </div>
          <div className={styles.configGroup}>
            <span className={styles.backupFieldLabel}>Limitar Ancho de Banda</span>
            <div className={styles.rangeFlex}>
              <input
                type="range"
                min="10"
                max="200"
                value={bandwidthLimit}
                onChange={handleBandwidthChange}
                className={styles.rangeInput}
              />
              <span className={styles.rangeValue}>{bandwidthLimit} MB/s</span>
            </div>
          </div>
          <div className={styles.mtAuto}>
            <button className={`${styles.backupBtnSecondary} ${styles.btnFull}`} onClick={pauseAll}>
              <Pause size={16} />
              Pausar toda la cola
            </button>
          </div>
        </div>

        {/* TARJETAS INDIVIDUALES: CADA DESCARGA ACTIVA ES SU PROPIA TARJETA */}
        {activeDownloads.length === 0 ? (
          <div className={`${styles.downloadCard} ${styles.relative}`}>
            {currentPlan === 'free' && (
              <div className={styles.absFullOverlay}>
                <PremiumLockButton
                  requiredPlan="intermedio"
                  label="Bloqueado"
                  sublabel="Mantén pulsado para Intermedio"
                  width="90%"
                  height="40px"
                />
              </div>
            )}
            <div className={styles.emptyState}>
              <Loader2 size={32} className={styles.iconMuted} />
              <span className={styles.emptyText}>No hay descargas activas</span>
            </div>
          </div>
        ) : (
          activeDownloads.map((d) => {
            const Icon = getDownloadIcon(d.name);
            const isPaused = d.status === 'paused';
            const unit = d.total >= 1 ? 'GB' : 'MB';
            const displayDownloaded =
              d.total >= 1 ? d.downloaded : (d.downloaded * 1024).toFixed(0);
            const displayTotal = d.total >= 1 ? d.total : (d.total * 1024).toFixed(0);
            return (
              <div key={d.id} className={`${styles.downloadCard} ${styles.relative}`}>
                {currentPlan === 'free' && (
                  <div className={styles.freeOverlay}>
                    <PremiumLockButton
                      requiredPlan="intermedio"
                      label="Bloqueado"
                      sublabel="Mantén pulsado para Intermedio"
                      width="90%"
                      height="40px"
                    />
                  </div>
                )}
                <div className={`${styles.backupCardTitle} ${styles.cardTitleNoBorder}`}>
                  <Icon size={16} />
                  {d.name}
                </div>
                <div className={`${styles.flexBetween} ${styles.itemsCenter} ${styles.gap10}`}>
                  <span className={styles.fileSizeStatus}>
                    {isPaused ? 'En pausa' : 'Descargando de ' + d.source} • {displayDownloaded}{' '}
                    {unit} de {displayTotal} {unit}
                  </span>
                  <div className={styles.itemActions}>
                    <button
                      className={styles.btnIcon}
                      title={isPaused ? 'Reanudar' : 'Pausar'}
                      onClick={() => pauseDownload(d.id)}
                    >
                      {isPaused ? <DownloadIcon size={14} /> : <Pause size={14} />}
                    </button>
                    <button
                      className={`${styles.btnIcon} ${styles.dangerBtn}`}
                      title="Cancelar"
                      onClick={() => cancelDownload(d.id)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
                <div className={styles.progressContainer}>
                  <div className={styles.progressBarBg}>
                    <div
                      className={`${styles.progressBarFill} ${d.progress === 100 ? styles.progressCompleted : ''} ${isPaused ? styles.progressPaused : ''}`}
                    />
                  </div>
                  <div className={styles.progressDetails}>
                    <span>
                      {d.progress}% • {displayDownloaded} {unit} / {displayTotal} {unit}
                    </span>
                    <span className={`${isPaused ? styles.textMuted : styles.colorSuccess}`}>
                      {isPaused
                        ? '— En pausa'
                        : `${d.speed} MB/s — Quedan ${Math.ceil(((d.total - d.downloaded) * 1024) / d.speed)}s`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* TARJETA: AJUSTES AVANZADOS */}
        <div className={`${styles.downloadCard} ${styles.relative}`}>
          {currentPlan === 'free' && (
            <div className={styles.absFullOverlay}>
              <PremiumLockButton
                requiredPlan="intermedio"
                label="Bloqueado"
                sublabel="Mantén pulsado para Intermedio"
                width="90%"
                height="40px"
              />
            </div>
          )}
          <div className={styles.backupCardTitle}>
            <Sliders size={16} />
            Ajustes de Rutas y Redundancia
          </div>
          <div className={styles.configGroup}>
            <span className={styles.backupFieldLabel}>Ruta de Destino Local</span>
            <input
              type="text"
              className={styles.textInput}
              value={downloadPath}
              onChange={(e) => setDownloadPath(e.target.value)}
            />
          </div>
          <div className={styles.configGroup}>
            <span className={styles.backupFieldLabel}>Optimización de CDN / Espejos</span>
            <div className={styles.inputContainer}>
              <select
                className={styles.backupSelect}
                value={cdnMirror}
                onChange={(e) => setCdnMirror(e.target.value)}
              >
                <option value="auto">Espejo Global Inteligente (Automático)</option>
                <option value="na">Región Norteamérica (AWS CDN Cloudflare)</option>
                <option value="eu">Región Europa Este (Failover Directo)</option>
              </select>
            </div>
          </div>
          <div className={styles.configGroup}>
            <span className={styles.backupFieldLabel}>Descargas Simultáneas</span>
            <div className={styles.inputContainer}>
              <select
                className={styles.backupSelect}
                value={concurrentDownloads}
                onChange={(e) => setConcurrentDownloads(e.target.value)}
              >
                <option value="2">2 Tareas simultáneas (Recomendado)</option>
                <option value="4">4 Tareas simultáneas (Ancho de banda ilimitado)</option>
                <option value="1">Secuencial estricto (1 a la vez)</option>
              </select>
            </div>
          </div>
          <div className={styles.mtAuto}>
            <button
              className={`${styles.backupBtnPrimary} ${styles.btnFull}`}
              onClick={applySettings}
            >
              <Save size={16} />
              Aplicar Ajustes
            </button>
          </div>
        </div>

        {/* TARJETA: HISTORIAL (SPAN 4) */}
        <div className={`${styles.downloadCard} ${styles.downloadCardDouble} ${styles.relative}`}>
          {currentPlan === 'free' && (
            <div className={styles.absFullOverlay}>
              <PremiumLockButton
                requiredPlan="intermedio"
                label="Bloqueado"
                sublabel="Mantén pulsado para Intermedio"
                width="90%"
                height="40px"
              />
            </div>
          )}
          <div className={styles.backupCardTitle}>
            <History size={16} />
            Historial de Archivos Guardados
          </div>
          {history.length === 0 ? (
            <div className={`${styles.emptyState} ${styles.p40_20}`}>
              <History size={32} className={styles.colorMuted} />
              <span className={styles.emptyText}>No hay archivos en el historial</span>
            </div>
          ) : (
            <div className={styles.historyList}>
              {history.map((h) => (
                <div key={h.id} className={styles.historyItem}>
                  <div className={styles.fileInfo}>
                    <span className={styles.badgeCategory}>{h.category}</span>
                    <div>
                      <div className={`${styles.fileName} ${styles.fontSize13_5}`}>{h.name}</div>
                      <div className={styles.fileSizeStatus}>{h.completed}</div>
                    </div>
                  </div>
                  <div className={styles.historyActions}>
                    <button
                      className={styles.btnIcon}
                      title="Abrir ubicación"
                      onClick={() => openLocation(h.id)}
                    >
                      <Server size={14} />
                    </button>
                    <button
                      className={`${styles.btnIcon} ${styles.dangerBtn}`}
                      title="Eliminar registro"
                      onClick={() => removeFromHistory(h.id)}
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BitacoraTab() {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');

  const logs = [
    {
      id: 1,
      user: 'Sistema',
      initials: 'S',
      avatarColor: '#e53935',
      action: 'Bloqueo de IP por peticiones denegadas',
      module: 'Autenticación / Core',
      ip: '192.168.100.42',
      severity: 'critical',
      time: '19:26:12',
    },
    {
      id: 2,
      user: 'Jonas Mendoza',
      initials: 'J',
      avatarColor: 'var(--color-primary)',
      action: 'Modificación de Tasa de Impuestos (IVA)',
      module: 'Stock Master Pro',
      ip: '180.23.45.102',
      severity: 'warning',
      time: '19:14:05',
    },
    {
      id: 3,
      user: 'Andy B.',
      initials: 'A',
      avatarColor: 'var(--color-success)',
      action: 'Creación de ticket de soporte #SGEN-4082',
      module: 'SGEN-Support',
      ip: '180.23.45.109',
      severity: 'info',
      time: '17:42:51',
    },
    {
      id: 4,
      user: 'Jonas Mendoza',
      initials: 'J',
      avatarColor: 'var(--color-primary)',
      action: 'Sincronización manual de registros JSON',
      module: 'Autenticación / Core',
      ip: '180.23.45.102',
      severity: 'info',
      time: '17:30:22',
    },
  ];

  const filteredLogs = logs.filter((l) => {
    const matchSearch =
      !searchTerm ||
      l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.ip.includes(searchTerm);
    const matchSeverity = severityFilter === 'all' || l.severity === severityFilter;
    const matchModule =
      moduleFilter === 'all' || l.module.toLowerCase().includes(moduleFilter.toLowerCase());
    return matchSearch && matchSeverity && matchModule;
  });

  const severityBadge: Record<string, { cls: string; label: string }> = {
    critical: { cls: 'badgeCritical', label: 'Crítico' },
    warning: { cls: 'badgeWarning', label: 'Advertencia' },
    info: { cls: 'badgeInfo', label: 'Información' },
  };

  return (
    <div className={styles.downloadContainer}>
      <div className={styles.backupHeader}>
        <h3>Bitácora de Acciones del Sistema</h3>
        <p>
          Auditoría inmutable de eventos, modificaciones operacionales y seguridad de la
          infraestructura.
        </p>
      </div>

      <div className={styles.downloadGrid}>
        {/* Widget 1: Eventos Hoy */}
        <div className={styles.downloadCard}>
          <div className={`${styles.statBlockFlex} ${styles.bitIconBox}`}>
            <div>
              <span className={styles.statLabel}>Eventos Hoy</span>
              <div className={styles.statValue}>1,402</div>
            </div>
            <div className={styles.bitIconBox}>
              <ClipboardList size={18} />
            </div>
          </div>
        </div>

        {/* Widget 2: Alertas Críticas */}
        <div className={styles.downloadCard}>
          <div className={`${styles.statBlockFlex} ${styles.bitIconBoxRed}`}>
            <div>
              <span className={styles.statLabel}>Alertas Críticas</span>
              <div className={`${styles.statValue} ${styles.statValueRed}`}>2</div>
            </div>
            <div className={styles.bitIconBoxRed}>
              <TriangleAlert size={18} />
            </div>
          </div>
        </div>

        {/* Widget 3: Tasa de Éxito */}
        <div className={styles.downloadCard}>
          <div className={`${styles.statBlockFlex} ${styles.bitIconBoxGreen}`}>
            <div>
              <span className={styles.statLabel}>Tasa de Éxito</span>
              <div className={`${styles.statValue} ${styles.statValueGreen}`}>99.8%</div>
            </div>
            <div className={styles.bitIconBoxGreen}>
              <ShieldCheck size={18} />
            </div>
          </div>
        </div>

        {/* Widget 4: Operadores Activos */}
        <div className={styles.downloadCard}>
          <div className={`${styles.statBlockFlex} ${styles.bitIconBox}`}>
            <div>
              <span className={styles.statLabel}>Operadores Activos</span>
              <div className={styles.statValue}>5</div>
            </div>
            <div className={styles.bitIconBox}>
              <Users size={18} />
            </div>
          </div>
        </div>

        {/* GRÁFICO: FLUJO DE ACTIVIDAD */}
        <div className={`${styles.downloadCard} ${styles.downloadCardDouble}`}>
          <div className={styles.backupCardTitle}>
            <Activity size={16} />
            Flujo de Actividad (24h)
          </div>
          <div className={styles.chartWrapper}>
            <svg className={styles.chartSvg} viewBox="0 0 400 100" preserveAspectRatio="none">
              <line x1="0" y1="20" x2="400" y2="20" stroke="var(--border-color)" strokeWidth="1" />
              <line x1="0" y1="50" x2="400" y2="50" stroke="var(--border-color)" strokeWidth="1" />
              <line x1="0" y1="80" x2="400" y2="80" stroke="var(--border-color)" strokeWidth="1" />
              <path
                d="M 0 80 L 50 75 L 100 40 L 150 45 L 200 90 L 250 25 L 300 30 L 350 65 L 400 20"
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            <div className={styles.chartLabelsRow}>
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>En Vivo</span>
            </div>
          </div>
        </div>

        {/* DESGLOSE: DISTRIBUCIÓN DE MÓDULOS */}
        <div className={`${styles.downloadCard} ${styles.downloadCardDouble}`}>
          <div className={styles.backupCardTitle}>
            <PieChart size={16} />
            Distribución de Módulos
          </div>
          <div className={styles.activityBreakdown}>
            <div className={styles.progressItem}>
              <div className={styles.progressInfoText}>
                <span>SGEN-Support (Soporte)</span>
                <span>542 eventos</span>
              </div>
              <div className={styles.barTrack}>
                <div className={`${styles.barFill} ${styles.progress55}`} />
              </div>
            </div>
            <div className={styles.progressItem}>
              <div className={styles.progressInfoText}>
                <span>Stock Master Pro (Inventario)</span>
                <span>310 eventos</span>
              </div>
              <div className={styles.barTrack}>
                <div className={`${styles.barFill} ${styles.progress32}`} />
              </div>
            </div>
            <div className={styles.progressItem}>
              <div className={styles.progressInfoText}>
                <span>Infraestructura y Seguridad</span>
                <span>124 eventos</span>
              </div>
              <div className={styles.barTrack}>
                <div className={`${styles.barFill} ${styles.progress13}`} />
              </div>
            </div>
          </div>
        </div>

        {/* TABLA CENTRAL DE BITÁCORA */}
        <div className={`${styles.downloadCard} ${styles.downloadCardDouble}`}>
          <div className={styles.filtersRow}>
            <div className={styles.searchContainer}>
              <Search size={15} className={styles.colorMutedFlex} />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Buscar por acción, IP, operador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className={styles.selectBox}>
              <select
                className={styles.bitSelect}
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
              >
                <option value="all">Todas las Severidades</option>
                <option value="info">Información (Info)</option>
                <option value="warning">Advertencia (Warning)</option>
                <option value="critical">Crítico (Critical)</option>
              </select>
            </div>
            <div className={styles.selectBox}>
              <select
                className={styles.bitSelect}
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
              >
                <option value="all">Todos los Módulos</option>
                <option value="sgen">SGEN-Support</option>
                <option value="stock">Stock Master Pro</option>
                <option value="autenticación">Autenticación / Core</option>
              </select>
            </div>
          </div>

          <div className={styles.logTable}>
            <div className={styles.tableHead}>
              <div>Operador</div>
              <div>Acción Realizada</div>
              <div>Módulo</div>
              <div>Dirección IP</div>
              <div>Severidad</div>
              <div className={styles.textRightPad10}>Marca de Tiempo</div>
            </div>

            {filteredLogs.length === 0 ? (
              <div className={`${styles.emptyState} ${styles.p40_20}`}>
                <Search size={32} className={styles.colorMuted} />
                <span className={styles.emptyText}>No se encontraron registros</span>
              </div>
            ) : (
              filteredLogs.map((l) => {
                const b = severityBadge[l.severity];
                return (
                  <div key={l.id} className={styles.tableRow}>
                    <div className={styles.bitUserCell}>
                      <div
                        className={`${styles.bitAvatar} ${styles.avatarDynamic}`}
                        style={{ '--avatar-color': l.avatarColor }}
                      >
                        {l.initials}
                      </div>
                      <span>{l.user}</span>
                    </div>
                    <div className={styles.bitActionCell}>{l.action}</div>
                    <div className={styles.bitModuleCell}>{l.module}</div>
                    <div className={styles.bitIpCell}>{l.ip}</div>
                    <div>
                      <span className={styles[b.cls]}>{b.label}</span>
                    </div>
                    <div className={styles.bitTimeCell}>{l.time}</div>
                  </div>
                );
              })
            )}
          </div>

          <button
            className={`${styles.backupBtnPrimary} ${styles.mt4}`}
            onClick={() => showToast('Generando paquete consolidado de auditoría...', 'success')}
          >
            <FileDown size={16} />
            Exportar Registro
          </button>
        </div>
      </div>
    </div>
  );
}

function LicensesTab() {
  const { showToast } = useToast();
  const {
    user,
    licenseBlocked,
    activateLicense,
    isAuthenticated,
    isLoading: authLoading,
  } = useAuth();
  const { config } = useTheme();
  const [licenseStatus, setLicenseStatus] = useState<any>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [days, setDays] = useState(365);
  const [tier, setTier] = useState('pro');
  const [targetTenantId, setTargetTenantId] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [generating, setGenerating] = useState(false);
  const [activationCode, setActivationCode] = useState('');
  const [activating, setActivating] = useState(false);
  const [showPremiumAnim, setShowPremiumAnim] = useState(false);
  const [cancelStep, setCancelStep] = useState(0);
  const [cancelConfirmText, setCancelConfirmText] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [reactivating, setReactivating] = useState(false);

  // Stripe States
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [selectedPlanForStripe, setSelectedPlanForStripe] = useState<string | null>(null);
  const [managingPortal, setManagingPortal] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || authLoading) return;
    api
      .getLicenseStatus()
      .then(setLicenseStatus)
      .catch(() => {})
      .finally(() => setStatusLoading(false));
  }, [isAuthenticated, authLoading]);

  const handleOpenPortal = async () => {
    setManagingPortal(true);
    try {
      const res = await api.getCustomerPortalSession();
      if (res?.url) {
        window.location.href = res.url;
      } else {
        showToast('No se pudo abrir el portal de facturación.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error al conectar con el portal de facturación.', 'error');
    } finally {
      setManagingPortal(false);
    }
  };

  const handlePaymentSuccess = () => {
    setShowStripeModal(false);
    setShowPremiumAnim(true);
    setStatusLoading(true);
    api
      .getLicenseStatus()
      .then(setLicenseStatus)
      .catch(() => {})
      .finally(() => setStatusLoading(false));
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await api.generateLicense({
        days,
        tier,
        targetTenantId: targetTenantId || undefined,
      });
      setGeneratedCode(res.code);
      showToast('Código de licencia generado exitosamente', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activationCode.trim()) return;
    setActivating(true);
    try {
      await activateLicense(activationCode.trim());
      showToast('Licencia activada correctamente', 'success');
      setActivationCode('');
      setShowPremiumAnim(true);
      api
        .getLicenseStatus()
        .then(setLicenseStatus)
        .catch(() => {});
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setActivating(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await api.cancelSubscription();
      showToast('Suscripción cancelada. La licencia ha sido bloqueada.', 'success');
      setCancelStep(0);
      setCancelConfirmText('');
      api
        .getLicenseStatus()
        .then(setLicenseStatus)
        .catch(() => {});
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setCancelling(false);
    }
  };

  const handleReactivate = async () => {
    setReactivating(true);
    try {
      const res = await api.reactivateLicense();
      showToast(res.message, 'success');
      api
        .getLicenseStatus()
        .then(setLicenseStatus)
        .catch(() => {});
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setReactivating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
    showToast('Código copiado al portapapeles', 'success');
  };

  const isExpired = licenseStatus && new Date(licenseStatus.expiresAt) < new Date();
  const isCanceled = licenseStatus?.status === 'canceled';
  const canReactivate = isCanceled && !isExpired;

  return (
    <div className={styles.backupContainer}>
      {statusLoading ? (
        <SkeletonTablePage rows={3} cols={2} tabs={0} kpi={2} />
      ) : (
        <>
          <div className={styles.backupHeader}>
            <h3>Estado de la Licencia</h3>
          </div>

          <UsageMeter />

          <div className={styles.backupGrid}>
            {licenseStatus ? (
              <div className={styles.backupCard}>
                <div className={styles.backupCardTitle}>
                  <Shield size={16} />
                  Licencia actual
                </div>
                <div className={`${styles.backupCard} ${styles.gridCols2Gap16}`}>
                  <div className={styles.configGroup}>
                    <span className={styles.backupFieldLabel}>Plan</span>
                    <span className={styles.fontSize16Bold}>{licenseStatus.tier}</span>
                  </div>
                  <div className={styles.configGroup}>
                    <span className={styles.backupFieldLabel}>Estado</span>
                    <span className={styles.colorGreenWeight600}>
                      {licenseBlocked || isExpired ? 'Bloqueada / Expirada' : 'Activa'}
                    </span>
                  </div>
                  <div className={styles.configGroup}>
                    <span className={styles.backupFieldLabel}>Fecha de activación</span>
                    <span className={styles.fontSize14Weight600}>
                      {licenseStatus.activatedAt
                        ? new Date(licenseStatus.activatedAt).toLocaleDateString()
                        : '—'}
                    </span>
                  </div>
                  <div className={styles.configGroup}>
                    <span className={styles.backupFieldLabel}>Fecha de expiración</span>
                    <span
                      className={`${styles.fontSize14Weight600} ${isExpired ? styles.colorRed : ''}`}
                    >
                      {licenseStatus.expiresAt
                        ? new Date(licenseStatus.expiresAt).toLocaleDateString()
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.backupCard}>
                <div className={styles.backupCardTitle}>
                  <Shield size={16} />
                  Licencia
                </div>
                <p className={styles.backupCardDesc}>
                  No se pudo obtener información de la licencia.
                </p>
              </div>
            )}

            {licenseStatus?.tier === 'free' ? (
              <div className={`${styles.backupCard} ${styles.backupCardDouble}`}>
                <div className={styles.backupCardTitle}>
                  <Sparkles size={16} className={styles.colorPrimary} />
                  Planes de Suscripción Premium (Stripe)
                </div>
                <p className={styles.backupCardDesc}>
                  Desbloquea instantáneamente todas las funciones profesionales y de auditoría.
                  Elige el plan que mejor se adapte a tu negocio.
                </p>
                <div className={styles.gridAutoFit220}>
                  <div className={`${styles.cardBorder} ${styles.flexColumnGap6Col}`}>
                    <div>
                      <h4 className={styles.fontSize15Bold}>Plan PRO</h4>
                      <p className={styles.subtitle11Muted}>
                        Ideal para comercios en crecimiento con personal a cargo y control de stock.
                      </p>
                      <div className={styles.fontSize22Bold}>
                        $39 <span className={styles.fontSize11Weight500}>/ mes</span>
                      </div>
                      <ul className={styles.listItemFlex}>
                        <li>Productos e inventario ilimitados</li>
                        <li>Hasta 5 usuarios concurrentes</li>
                        <li>Hasta 2 almacenes / sucursales</li>
                        <li>Cuentas por pagar y gastos fijos</li>
                        <li>Clientes con límite de crédito</li>
                      </ul>
                    </div>
                    <button
                      className={`${styles.backupBtnPrimary} ${styles.btnFullWidth} ${styles.mt10}`}
                      onClick={() => {
                        setSelectedPlanForStripe('pro');
                        setShowStripeModal(true);
                      }}
                    >
                      Suscribirse a PRO
                    </button>
                  </div>

                  <div className={`${styles.laserBorderCard} ${styles.flexColumnGap6Col}`}>
                    <div className={styles.absTopRightZero}>RECOMENDADO</div>
                    <div className={styles.flexColumnGap6Col}>
                      <h4 className={styles.fontSize15Bold}>Plan Enterprise</h4>
                      <p className={styles.subtitle11Muted}>
                        Auditoría avanzada para operaciones de alta facturación y múltiples
                        sucursales.
                      </p>
                      <div className={styles.fontSize22Bold}>
                        $79 <span className={styles.fontSize11Weight500}>/ mes</span>
                      </div>
                      <ul className={styles.listItemFlex}>
                        <li>Todo lo del plan PRO e ilimitado</li>
                        <li>Usuarios y almacenes ilimitados</li>
                        <li>Notas de crédito y proveedores</li>
                        <li>PWA offline (POS sin internet)</li>
                        <li>Soporte técnico prioritario</li>
                      </ul>
                    </div>
                    <button
                      className={`${styles.backupBtnPrimary} ${styles.btnShimmerActive} ${styles.btnFullWidth} ${styles.mt10}`}
                      onClick={() => {
                        setSelectedPlanForStripe('enterprise');
                        setShowStripeModal(true);
                      }}
                    >
                      Suscribirse a Enterprise
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              (licenseStatus?.tier === 'pro' || licenseStatus?.tier === 'enterprise') && (
                <div className={styles.backupCard}>
                  <div className={styles.backupCardTitle}>
                    <CardIcon size={16} />
                    Portal de Facturación
                  </div>
                  <p className={styles.backupCardDesc}>
                    Accede a tu portal de autogestión de Stripe para cambiar tu método de pago, ver
                    tus facturas descargables o dar de baja tu suscripción.
                  </p>
                  <button
                    className={styles.backupBtnPrimary}
                    onClick={handleOpenPortal}
                    disabled={managingPortal}
                  >
                    {managingPortal ? 'Cargando Portal...' : 'Gestionar en Stripe'}
                  </button>
                </div>
              )
            )}

            <div className={styles.backupCard}>
              <div className={styles.backupCardTitle}>
                <Shield size={16} />
                Activar licencia
              </div>
              <p className={styles.backupCardDesc}>
                {licenseBlocked || isExpired
                  ? 'Tu licencia está bloqueada o expirada. Ingresa un código de activación para reactivar el sistema.'
                  : 'Si tienes un código de activación, ingrésalo aquí para asociarlo a tu cuenta.'}
              </p>
              <form onSubmit={handleActivate} className={styles.flexColumnGap12}>
                <input
                  className={styles.tcInput}
                  type="text"
                  value={activationCode}
                  onChange={(e) => setActivationCode(e.target.value)}
                  placeholder="Código de licencia"
                  required
                />
                <button
                  type="submit"
                  className={styles.backupBtnPrimary}
                  disabled={activating || !activationCode.trim()}
                >
                  {activating ? 'Activando...' : 'Activar Licencia'}
                </button>
              </form>
            </div>

            {!isCanceled && !isExpired && (
              <div className={styles.backupCard}>
                <div className={styles.backupCardTitle}>
                  <Shield size={16} />
                  Cancelar suscripción
                </div>

                {cancelStep === 0 && (
                  <>
                    <p className={styles.backupCardDesc}>
                      Al cancelar, tu licencia será bloqueada y perderás acceso al sistema.
                    </p>
                    <button
                      className={`${styles.btnSecondary} ${styles.confirmBtnRed}`}
                      onClick={() => setCancelStep(1)}
                    >
                      Cancelar suscripción
                    </button>
                  </>
                )}

                {cancelStep === 1 && (
                  <>
                    <p className={`${styles.backupCardDesc} ${styles.colorRedWeight600}`}>
                      ¿Estás completamente seguro? Esta acción bloqueará tu licencia de forma
                      inmediata.
                    </p>
                    <div className={styles.flexGap12Full}>
                      <button
                        className={`${styles.btnSecondary} ${styles.btnFlex1}`}
                        onClick={() => {
                          setCancelStep(0);
                          setCancelConfirmText('');
                        }}
                      >
                        Volver
                      </button>
                      <button
                        className={`${styles.btnSecondary} ${styles.btnFlex1Red}`}
                        onClick={() => setCancelStep(2)}
                      >
                        Sí, continuar
                      </button>
                    </div>
                  </>
                )}

                {cancelStep === 2 && (
                  <>
                    <p className={`${styles.backupCardDesc} ${styles.colorRedWeight600}`}>
                      Confirmación final. Escribe <strong>CANCELAR</strong> para confirmar la
                      cancelación.
                    </p>
                    <input
                      className={styles.tcInput}
                      type="text"
                      value={cancelConfirmText}
                      onChange={(e) => setCancelConfirmText(e.target.value)}
                      placeholder="Escribe CANCELAR"
                    />
                    <div className={styles.flexGap12Full}>
                      <button
                        className={`${styles.btnSecondary} ${styles.btnFlex1}`}
                        onClick={() => {
                          setCancelStep(0);
                          setCancelConfirmText('');
                        }}
                      >
                        Atrás
                      </button>
                      <button
                        className={`${styles.btnSecondary} ${styles.confirmBtnRedConditional}`}
                        disabled={cancelConfirmText !== 'CANCELAR' || cancelling}
                        onClick={handleCancel}
                      >
                        {cancelling ? 'Cancelando...' : 'Cancelar suscripción'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {canReactivate && user?.role === 'admin' && (
              <div className={styles.backupCard}>
                <div className={styles.backupCardTitle}>
                  <Shield size={16} />
                  Reactivar suscripción
                </div>
                <p className={styles.backupCardDesc}>
                  La licencia está cancelada pero aún no ha expirado. Puedes reactivarla.
                </p>
                <button
                  className={`${styles.backupBtnPrimary} ${styles.selfStart}`}
                  onClick={() => {
                    if (
                      window.confirm(
                        '¿Reactivar la suscripción? El tenant volverá a tener acceso inmediato.'
                      )
                    ) {
                      handleReactivate();
                    }
                  }}
                  disabled={reactivating}
                >
                  {reactivating ? 'Reactivando...' : 'Reactivar suscripción'}
                </button>
              </div>
            )}
          </div>

          {user?.email === 'admin@stockmaster.com' && (
            <div className={`${styles.backupGrid} ${styles.mt20}`}>
              <div className={styles.backupCard}>
                <div className={styles.backupCardTitle}>
                  <Shield size={16} />
                  Generar código de licencia
                </div>
                <div className={styles.configGroup}>
                  <span className={styles.backupFieldLabel}>Días de duración</span>
                  <input
                    type="number"
                    className={styles.tcInput}
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                    min={1}
                  />
                </div>
                <div className={styles.configGroup}>
                  <span className={styles.backupFieldLabel}>Tier / Plan</span>
                  <div className={styles.backupSelectWrap}>
                    <select
                      className={styles.backupSelect}
                      value={tier}
                      onChange={(e) => setTier(e.target.value)}
                    >
                      <option value="pro">PRO</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                </div>
                <div className={styles.configGroup}>
                  <span className={styles.backupFieldLabel}>Target Tenant ID (opcional)</span>
                  <input
                    type="text"
                    className={styles.tcInput}
                    value={targetTenantId}
                    onChange={(e) => setTargetTenantId(e.target.value)}
                    placeholder="Dejar vacío para el tenant actual"
                  />
                </div>
                <button
                  className={styles.backupBtnPrimary}
                  onClick={handleGenerate}
                  disabled={generating}
                >
                  {generating ? 'Generando...' : 'Generar Código'}
                </button>
                {generatedCode && (
                  <div className={styles.flexColumnGap8}>
                    <div className={styles.flexBetweenCenter}>
                      <span className={`${styles.backupFieldLabel} ${styles.colorGreenWeight600}`}>
                        Código generado
                      </span>
                      <button
                        className={`${styles.btnSecondary} ${styles.p8} ${styles.fontSize11}`}
                        onClick={copyToClipboard}
                      >
                        Copiar
                      </button>
                    </div>
                    <textarea
                      className={`${styles.tcInput} ${styles.fontMono11}`}
                      value={generatedCode}
                      readOnly
                      rows={3}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {showPremiumAnim && <PremiumActivationAnimation onClose={() => setShowPremiumAnim(false)} />}

      <StripeCheckoutModal
        open={showStripeModal}
        planType={selectedPlanForStripe || ''}
        onClose={() => {
          setShowStripeModal(false);
          setSelectedPlanForStripe(null);
        }}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}

function BackupTab() {
  const { licenseStatus } = useAuth();
  const currentPlan = licenseStatus?.tier || 'free';
  const fileRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [exportModules, setExportModules] = useState({
    systemStructure: true,
    taxCurrency: true,
    interfacePrefs: false,
  });
  const [backupFrequency, setBackupFrequency] = useState('daily');
  const [backupDestination, setBackupDestination] = useState('local');
  const [emailNotifications, setEmailNotifications] = useState(true);

  const handleExport = () => {
    const data: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) data[key] = localStorage.getItem(key) || '';
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stockmaster-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportStatus('Datos exportados correctamente');
    setTimeout(() => setExportStatus(null), 3000);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        Object.entries(data).forEach(([key, value]) => {
          localStorage.setItem(key, String(value));
        });
        setImportStatus('Datos importados correctamente. Recargue la página para ver los cambios.');
        setTimeout(() => setImportStatus(null), 5000);
      } catch {
        setImportStatus('Error: el archivo no tiene un formato válido.');
        setTimeout(() => setImportStatus(null), 5000);
      }
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  const toggleModule = (key: 'systemStructure' | 'taxCurrency' | 'interfacePrefs') => {
    setExportModules((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className={styles.backupContainer}>
      <div className={styles.backupHeader}>
        <h3>Respaldo y Seguridad de Datos</h3>
        <p>Administra las políticas de exportación, restauración y redundancia del sistema.</p>
      </div>

      <div className={styles.backupGrid}>
        {/* TARJETA 1: EXPORTACIÓN MODULAR */}
        <div className={styles.backupCard}>
          <div className={styles.backupCardTitle}>
            <Download size={16} />
            Exportar Configuración
          </div>
          <p className={styles.backupCardDesc}>
            Genera y descarga un archivo cifrado en formato JSON estructurado con la información
            actual de tu plataforma.
          </p>
          <div className={styles.backupModuleList}>
            <div className={styles.backupModuleItem}>
              <span>Estructura del Sistema</span>
              <button
                className={`${styles.pToggle} ${exportModules.systemStructure ? styles.pToggleOn : ''}`}
                onClick={() => toggleModule('systemStructure')}
              >
                <span className={styles.pToggleKnob} />
              </button>
            </div>
            <div className={styles.backupModuleItem}>
              <span>Impuestos y Monedas</span>
              <button
                className={`${styles.pToggle} ${exportModules.taxCurrency ? styles.pToggleOn : ''}`}
                onClick={() => toggleModule('taxCurrency')}
              >
                <span className={styles.pToggleKnob} />
              </button>
            </div>
            <div className={styles.backupModuleItem}>
              <span>Preferencias de Interfaz</span>
              <button
                className={`${styles.pToggle} ${exportModules.interfacePrefs ? styles.pToggleOn : ''}`}
                onClick={() => toggleModule('interfacePrefs')}
              >
                <span className={styles.pToggleKnob} />
              </button>
            </div>
          </div>
          {currentPlan === 'free' ? (
            <PremiumLockButton
              requiredPlan="intermedio"
              width="100%"
              height="38px"
              label="Exportar Bloqueado"
              sublabel="Mantén pulsado para Intermedio"
            />
          ) : (
            <button className={styles.backupBtnPrimary} onClick={handleExport}>
              <FileDown size={16} />
              Exportar datos
            </button>
          )}
          {exportStatus && <span className={styles.backupStatus}>{exportStatus}</span>}
        </div>

        {/* TARJETA 2: IMPORTACIÓN INTELIGENTE */}
        <div className={styles.backupCard}>
          <div className={styles.backupCardTitle}>
            <Upload size={16} />
            Importar y Restaurar
          </div>
          <p className={styles.backupCardDesc}>
            Carga un paquete JSON previamente estructurado para sobrescribir o restaurar parámetros
            de configuración global de forma inmediata.
          </p>
          <div className={styles.dropzone} onClick={() => fileRef.current?.click()}>
            <FileCode size={28} />
            <div className={styles.dropzoneText}>
              <h4>{fileName ? 'Archivo cargado con éxito' : 'Selecciona o suelta tu archivo'}</h4>
              <p>
                {fileName
                  ? `${fileName} listo para procesar.`
                  : 'Formatos admitidos: .json (Máx. 8MB)'}
              </p>
            </div>
            <input ref={fileRef} type="file" accept=".json" onChange={handleImport} hidden />
          </div>
          {currentPlan === 'free' ? (
            <PremiumLockButton
              requiredPlan="intermedio"
              width="100%"
              height="38px"
              label="Importar Bloqueado"
              sublabel="Mantén pulsado para Intermedio"
            />
          ) : (
            <button className={styles.backupBtnSecondary} onClick={() => fileRef.current?.click()}>
              <FileUp size={16} />
              Importar datos
            </button>
          )}
          {importStatus && <span className={styles.backupStatus}>{importStatus}</span>}
        </div>

        {/* TARJETA 3: AUTOMATIZACIÓN EN LA NUBE */}
        <div className={styles.backupCard}>
          <div className={styles.backupCardTitle}>
            <Cloud size={16} />
            Respaldos Automatizados
          </div>
          <p className={styles.backupCardDesc}>
            Garantiza la resiliencia tecnológica programando copias de seguridad automáticas
            directas a repositorios cloud externos.
          </p>
          <div className={styles.backupFieldGroup}>
            <span className={styles.backupFieldLabel}>Frecuencia de Copias</span>
            <div className={styles.backupSelectWrap}>
              <select
                className={styles.backupSelect}
                value={backupFrequency}
                onChange={(e) => setBackupFrequency(e.target.value)}
              >
                <option value="daily">Cada 24 horas (Diario automatizado)</option>
                <option value="weekly">Cada fin de semana (Sábados 00:00)</option>
                <option value="monthly">Mensual consolidado</option>
              </select>
            </div>
          </div>
          <div className={styles.backupFieldGroup}>
            <span className={styles.backupFieldLabel}>Destino de Almacenamiento Cloud</span>
            <div className={styles.backupSelectWrap}>
              <select
                className={styles.backupSelect}
                value={backupDestination}
                onChange={(e) => setBackupDestination(e.target.value)}
              >
                <option value="local">Servidor Local Seguro (Por defecto)</option>
                <option value="aws">Amazon Web Services (AWS S3 Bucket)</option>
                <option value="gcp">Google Cloud Storage Cluster</option>
              </select>
            </div>
          </div>
          <div className={styles.backupToggleRow}>
            <span>Notificaciones por correo</span>
            <button
              className={`${styles.pToggle} ${emailNotifications ? styles.pToggleOn : ''}`}
              onClick={() => setEmailNotifications(!emailNotifications)}
            >
              <span className={styles.pToggleKnob} />
            </button>
          </div>
        </div>

        {/* TARJETA 4: HISTORIAL DE AUDITORÍA (SPAN 2) */}
        <div className={`${styles.backupCard} ${styles.backupCardDouble}`}>
          <div className={styles.backupCardTitle}>
            <History size={16} />
            Registro e Historial de Respaldos
          </div>
          <p className={styles.backupCardDesc}>
            Bitácora histórica verificada de las últimas operaciones de respaldo y restauración
            ejecutadas en el entorno.
          </p>
          <div className={styles.historyList}>
            <div className={styles.historyItem}>
              <div className={styles.historyMeta}>
                <span className={styles.badgeSuccess}>Éxito</span>
                <div className={styles.historyInfo}>
                  <p>backup_sistema_produccion.json</p>
                  <span>Hace 2 horas • Tamaño: 1.4 MB • Manual</span>
                </div>
              </div>
              <div className={styles.historyActions}>
                <button className={styles.historyBtn} title="Descargar copia">
                  <Download size={14} />
                </button>
                <button className={styles.historyBtn} title="Restaurar a esta versión">
                  <RotateCcw size={14} />
                </button>
              </div>
            </div>
            <div className={styles.historyItem}>
              <div className={styles.historyMeta}>
                <span className={styles.badgeSuccess}>Éxito</span>
                <div className={styles.historyInfo}>
                  <p>auto_backup_cloud_weekly.json</p>
                  <span>28 de Junio, 2026 • Tamaño: 1.2 MB • AWS S3</span>
                </div>
              </div>
              <div className={styles.historyActions}>
                <button className={styles.historyBtn} title="Descargar copia">
                  <Download size={14} />
                </button>
                <button className={styles.historyBtn} title="Restaurar a esta versión">
                  <RotateCcw size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
