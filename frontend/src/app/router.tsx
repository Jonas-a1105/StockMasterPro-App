import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { useTheme } from '@contexts/ThemeContext';
import { DashboardLayout } from '@features/dashboard/components/DashboardLayout';
import { LicenseBlock } from '@shared/ui/LicenseBlock';
import { PremiumActivationAnimation } from '@shared/ui/PremiumActivationAnimation';
import { LoadingDots } from '@shared/ui/LoadingDots';
import { SkeletonTablePage, SkeletonReports, SkeletonPOSLayout, SkeletonForm, SkeletonKPI, SkeletonChart, SkeletonCards } from '@shared/ui/Skeleton';
import { startOfflineSync } from '@shared/lib/sync/sync';
import { useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { SplashScreen } from '@shared/ui/SplashScreen';
import { PremiumLockScreen } from '@shared/ui/PremiumLockScreen';

const LoginPage = lazy(() => import('@features/auth/pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@features/auth/pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const DashboardPage = lazy(() => import('@features/dashboard/pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const POSPage = lazy(() => import('@features/pos/pages/POSPage').then(m => ({ default: m.POSPage })));
const InventoryPage = lazy(() => import('@features/inventory/pages/InventoryPage').then(m => ({ default: m.InventoryPage })));
const ReportsPage = lazy(() => import('@features/reports/pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const SettingsPage = lazy(() => import('@features/settings/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const UsersPage = lazy(() => import('@features/users/pages/UsersPage').then(m => ({ default: m.UsersPage })));
const CustomersPage = lazy(() => import('@features/customers/pages/CustomersPage').then(m => ({ default: m.CustomersPage })));
const AccountsPayablePage = lazy(() => import('@features/accounts-payable/pages/AccountsPayablePage').then(m => ({ default: m.AccountsPayablePage })));
const ExpensesPage = lazy(() => import('@features/expenses/pages/ExpensesPage').then(m => ({ default: m.ExpensesPage })));
const CreditNotesPage = lazy(() => import('@features/credit-notes/pages/CreditNotesPage').then(m => ({ default: m.CreditNotesPage })));
const NetProfitPage = lazy(() => import('@features/net-profit/pages/NetProfitPage').then(m => ({ default: m.NetProfitPage })));
const LowStockPage = lazy(() => import('@features/stock-alerts/pages/LowStockPage').then(m => ({ default: m.LowStockPage })));
const BestSellersPage = lazy(() => import('@features/best-sellers/pages/BestSellersPage').then(m => ({ default: m.BestSellersPage })));
const WarehousePage = lazy(() => import('@features/warehouses/pages/WarehousePage').then(m => ({ default: m.WarehousePage })));
const LicenseToolPage = lazy(() => import('@features/licenses/pages/LicenseToolPage').then(m => ({ default: m.LicenseToolPage })));
const AgendaDigitalPage = lazy(() => import('@features/agenda/pages/AgendaDigitalPage').then(m => ({ default: m.AgendaDigitalPage })));
const AdminTenantsPage = lazy(() => import('@features/admin/pages/AdminTenantsPage').then(m => ({ default: m.AdminTenantsPage })));
const LandingPage = lazy(() => import('@features/landing/LandingPage').then(m => ({ default: m.LandingPage })));
const SocialPage = lazy(() => import('@features/social/SocialPage').then(m => ({ default: m.SocialPage })));

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const { config } = useTheme();
  if (isLoading) return config.skeletonEnabled ? <SkeletonKPI count={3} /> : <LoadingDots text="Verificando sesión" />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const { config } = useTheme();
  if (isLoading) return config.skeletonEnabled ? <SkeletonKPI count={3} /> : <LoadingDots text="Verificando sesión" />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function PlanRoute({ requiredPlan, sectionName, children }: { requiredPlan: 'intermedio' | 'pro'; sectionName: string; children: ReactNode }) {
  const { licenseStatus, isLoading } = useAuth();
  if (isLoading) return <LoadingDots text="Verificando plan..." />;

  const currentPlan = licenseStatus?.tier || 'free';
  let isAllowed = false;
  if (requiredPlan === 'intermedio') {
    isAllowed = currentPlan === 'intermedio' || currentPlan === 'pro' || currentPlan === 'enterprise';
  } else if (requiredPlan === 'pro') {
    isAllowed = currentPlan === 'pro' || currentPlan === 'enterprise';
  }

  if (!isAllowed) {
    return <PremiumLockScreen sectionName={sectionName} requiredPlan={requiredPlan} />;
  }

  return <>{children}</>;
}

function AdminRoute({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingDots text="Verificando permisos..." />;
  if (!isAuthenticated || user?.email !== 'admin@stockmaster.com') {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

function LicenseCheck({ children }: { children: ReactNode }) {
  const { licenseBlocked, activateLicense } = useAuth();
  const [showPremiumAnim, setShowPremiumAnim] = useState(false);

  const handleActivate = async (code: string) => {
    await activateLicense(code);
    setShowPremiumAnim(true);
  };

  if (showPremiumAnim) {
    return <PremiumActivationAnimation onClose={() => setShowPremiumAnim(false)} />;
  }
  if (licenseBlocked) {
    return <LicenseBlock onActivate={handleActivate} />;
  }
  return <>{children}</>;
}

function LazySuspense({ children }: { children: ReactNode }) {
  return <Suspense fallback={<SkeletonForm fields={3} />}>{children}</Suspense>;
}

export function AppRouter() {
  useEffect(() => {
    const cleanup = startOfflineSync();
    return cleanup;
  }, []);

  return (
    <LicenseCheck>
      <Routes>
        <Route path="/" element={<Suspense fallback={<LoadingDots text="Cargando" />}><LandingPage /></Suspense>} />
        <Route path="/pricing" element={<Suspense fallback={<LoadingDots text="Cargando" />}><LandingPage /></Suspense>} />
        <Route path="/login" element={<PublicRoute><LazySuspense><LoginPage /></LazySuspense></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><LazySuspense><RegisterPage /></LazySuspense></PublicRoute>} />

        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Suspense fallback={<><SkeletonKPI count={6} /><SkeletonChart height={250} /></>}><DashboardPage /></Suspense>} />
          <Route path="/pos" element={<Suspense fallback={<SkeletonPOSLayout />}><POSPage /></Suspense>} />
          <Route path="/inventory" element={<Suspense fallback={<SkeletonTablePage />}><InventoryPage /></Suspense>} />
          <Route path="/settings" element={<Suspense fallback={<SkeletonForm />}><SettingsPage /></Suspense>} />
          <Route path="/reports" element={<PlanRoute requiredPlan="intermedio" sectionName="Reportes"><Suspense fallback={<SkeletonReports />}><ReportsPage /></Suspense></PlanRoute>} />
          <Route path="/users" element={<Suspense fallback={<SkeletonTablePage tabs={0} kpi={3} />}><UsersPage /></Suspense>} />
          <Route path="/customers" element={<PlanRoute requiredPlan="pro" sectionName="Gestión de Clientes"><Suspense fallback={<SkeletonTablePage tabs={0} kpi={3} />}><CustomersPage /></Suspense></PlanRoute>} />
          <Route path="/accounts-payable" element={<PlanRoute requiredPlan="pro" sectionName="Cuentas por Pagar"><Suspense fallback={<SkeletonTablePage tabs={0} kpi={3} />}><AccountsPayablePage /></Suspense></PlanRoute>} />
          <Route path="/expenses" element={<PlanRoute requiredPlan="pro" sectionName="Gastos"><Suspense fallback={<SkeletonTablePage tabs={0} kpi={3} />}><ExpensesPage /></Suspense></PlanRoute>} />
          <Route path="/credit-notes" element={<PlanRoute requiredPlan="pro" sectionName="Notas de Crédito"><Suspense fallback={<SkeletonTablePage tabs={0} kpi={3} />}><CreditNotesPage /></Suspense></PlanRoute>} />
          <Route path="/net-profit" element={<PlanRoute requiredPlan="intermedio" sectionName="Utilidad Neta"><Suspense fallback={<SkeletonReports chartCount={2} />}><NetProfitPage /></Suspense></PlanRoute>} />
          <Route path="/low-stock" element={<Suspense fallback={<SkeletonTablePage tabs={0} kpi={3} />}><LowStockPage /></Suspense>} />
          <Route path="/best-sellers" element={<PlanRoute requiredPlan="intermedio" sectionName="Best-Sellers"><Suspense fallback={<SkeletonTablePage tabs={2} kpi={3} />}><BestSellersPage /></Suspense></PlanRoute>} />
          <Route path="/warehouses" element={<PlanRoute requiredPlan="pro" sectionName="Almacenes"><Suspense fallback={<SkeletonTablePage tabs={0} kpi={3} />}><WarehousePage /></Suspense></PlanRoute>} />
          <Route path="/license-tool" element={<AdminRoute><Suspense fallback={<SkeletonForm fields={4} />}><LicenseToolPage /></Suspense></AdminRoute>} />
          <Route path="/agenda" element={<PlanRoute requiredPlan="pro" sectionName="Agenda Digital"><Suspense fallback={<SkeletonCards count={6} />}><AgendaDigitalPage /></Suspense></PlanRoute>} />
          <Route path="/admin/tenants" element={<AdminRoute><Suspense fallback={<SkeletonTablePage tabs={0} kpi={3} />}><AdminTenantsPage /></Suspense></AdminRoute>} />
        </Route>

        <Route path="/social" element={<ProtectedRoute><Suspense fallback={<SkeletonCards count={6} />}><SocialPage /></Suspense></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </LicenseCheck>
  );
}
