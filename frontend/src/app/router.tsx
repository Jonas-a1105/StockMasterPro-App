import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { useTheme } from '@contexts/ThemeContext';
import { DashboardLayout } from '@features/dashboard/components/DashboardLayout';
import { LicenseBlock } from '@features/billing/components/LicenseBlock';
import { PremiumActivationAnimation } from '@features/billing/components/PremiumActivationAnimation';
import { LoadingDots } from '@shared/ui/LoadingDots';
import styles from './router.module.css';
import {
  SkeletonTablePage,
  SkeletonReports,
  SkeletonPOSLayout,
  SkeletonForm,
  SkeletonKPI,
  SkeletonChart,
  SkeletonCards,
} from '@shared/ui/Skeleton';
import { startOfflineSync } from '@shared/lib/sync/sync';
import { SplashScreen } from '@features/shared-ui';
import { PremiumLockScreen } from '@features/billing/components/PremiumLockScreen';
import { ErrorBoundary } from '@shared/ui/ErrorBoundary';
import { NotFoundPage } from '@pages/NotFoundPage';

const UIDevCatalog = lazy(() =>
  import('@pages/UIDevCatalog').then((m) => ({ default: m.default }))
);

const LoginPage = lazy(() =>
  import('@features/auth/pages/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const RegisterPage = lazy(() =>
  import('@features/auth/pages/RegisterPage').then((m) => ({ default: m.RegisterPage }))
);
const DashboardPage = lazy(() =>
  import('@features/dashboard/pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const POSPage = lazy(() =>
  import('@features/pos/pages/POSPage').then((m) => ({ default: m.POSPage }))
);
const InventoryPage = lazy(() =>
  import('@features/inventory/pages/InventoryPage').then((m) => ({ default: m.InventoryPage }))
);
const ReportsPage = lazy(() =>
  import('@features/reports/pages/ReportsPage').then((m) => ({ default: m.ReportsPage }))
);
const SettingsPage = lazy(() =>
  import('@features/settings/pages/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);
const UsersPage = lazy(() =>
  import('@features/users/pages/UsersPage').then((m) => ({ default: m.UsersPage }))
);
const CustomersPage = lazy(() =>
  import('@features/customers/pages/CustomersPage').then((m) => ({ default: m.CustomersPage }))
);
const AccountsPayablePage = lazy(() =>
  import('@features/accounts-payable/pages/AccountsPayablePage').then((m) => ({
    default: m.AccountsPayablePage,
  }))
);
const AccountsReceivablePage = lazy(() =>
  import('@features/accounts-receivable/pages/AccountsReceivablePage').then((m) => ({
    default: m.AccountsReceivablePage,
  }))
);
const CashRegisterPage = lazy(() =>
  import('@features/cash-register/pages/CashRegisterPage').then((m) => ({
    default: m.CashRegisterPage,
  }))
);
const SalesHistoryPage = lazy(() =>
  import('@features/sales/pages/SalesHistoryPage').then((m) => ({ default: m.SalesHistoryPage }))
);
const ExpensesPage = lazy(() =>
  import('@features/expenses/pages/ExpensesPage').then((m) => ({ default: m.ExpensesPage }))
);
const CreditNotesPage = lazy(() =>
  import('@features/credit-notes/pages/CreditNotesPage').then((m) => ({
    default: m.CreditNotesPage,
  }))
);
const NetProfitPage = lazy(() =>
  import('@features/net-profit/pages/NetProfitPage').then((m) => ({ default: m.NetProfitPage }))
);
const LowStockPage = lazy(() =>
  import('@features/stock-alerts/pages/LowStockPage').then((m) => ({ default: m.LowStockPage }))
);
const BestSellersPage = lazy(() =>
  import('@features/best-sellers/pages/BestSellersPage').then((m) => ({
    default: m.BestSellersPage,
  }))
);
const WarehousePage = lazy(() =>
  import('@features/warehouses/pages/WarehousePage').then((m) => ({ default: m.WarehousePage }))
);
const LicenseToolPage = lazy(() =>
  import('@features/licenses/pages/LicenseToolPage').then((m) => ({ default: m.LicenseToolPage }))
);
const AgendaDigitalPage = lazy(() =>
  import('@features/agenda/pages/AgendaDigitalPage').then((m) => ({ default: m.AgendaDigitalPage }))
);
const AdminTenantsPage = lazy(() =>
  import('@features/admin/pages/AdminTenantsPage').then((m) => ({ default: m.AdminTenantsPage }))
);
const SuperAdminDashboard = lazy(() =>
  import('@features/admin/pages/SuperAdminDashboard').then((m) => ({
    default: m.SuperAdminDashboard,
  }))
);
const LandingPage = lazy(() =>
  import('@features/landing/LandingPage').then((m) => ({ default: m.LandingPage }))
);
const SocialPage = lazy(() =>
  import('@features/social/SocialPage').then((m) => ({ default: m.SocialPage }))
);
const NotificationsPage = lazy(() =>
  import('@features/notifications/pages/NotificationsPage').then((m) => ({
    default: m.NotificationsPage,
  }))
);
const CategoriesPage = lazy(() =>
  import('@features/categories/pages/CategoriesPage').then((m) => ({ default: m.CategoriesPage }))
);
const ReturnsPage = lazy(() =>
  import('@features/returns/pages/ReturnsPage').then((m) => ({ default: m.ReturnsPage }))
);
const WarehouseTransfersPage = lazy(() =>
  import('@features/warehouse-transfers/pages/WarehouseTransfersPage').then((m) => ({
    default: m.WarehouseTransfersPage,
  }))
);
const ProductLotsPage = lazy(() =>
  import('@features/product-lots/pages/ProductLotsPage').then((m) => ({
    default: m.ProductLotsPage,
  }))
);
const FiscalPage = lazy(() =>
  import('@features/fiscal/pages/FiscalPage').then((m) => ({ default: m.FiscalPage }))
);
const DeadProductsPage = lazy(() =>
  import('@features/reports/pages/DeadProductsPage').then((m) => ({ default: m.DeadProductsPage }))
);
const ForgotPasswordPage = lazy(() =>
  import('@features/auth/pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage }))
);
const ResetPasswordPage = lazy(() =>
  import('@features/auth/pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage }))
);

function FullScreenLoader({ text }: { text: string }) {
  return (
    <div className={styles.fullScreenLoader}>
      <LoadingDots text={text} />
    </div>
  );
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <FullScreenLoader text="Verificando sesión" />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <FullScreenLoader text="Verificando sesión" />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function PlanRoute({
  requiredPlan,
  sectionName,
  children,
}: {
  requiredPlan: 'intermedio' | 'pro';
  sectionName: string;
  children: ReactNode;
}) {
  const { licenseStatus, isLoading } = useAuth();
  if (isLoading) return <LoadingDots text="Verificando plan..." />;

  const currentPlan = licenseStatus?.tier || 'free';
  let isAllowed = false;
  if (requiredPlan === 'intermedio') {
    isAllowed =
      currentPlan === 'intermedio' || currentPlan === 'pro' || currentPlan === 'enterprise';
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
  if (!isAuthenticated || user?.role !== 'admin') {
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
    <ErrorBoundary>
      <LicenseCheck>
        <Routes>
          <Route
            path="/"
            element={
              <Suspense fallback={<LoadingDots text="Cargando" />}>
                <LandingPage />
              </Suspense>
            }
          />
          <Route
            path="/pricing"
            element={
              <Suspense fallback={<LoadingDots text="Cargando" />}>
                <LandingPage />
              </Suspense>
            }
          />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LazySuspense>
                  <LoginPage />
                </LazySuspense>
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <LazySuspense>
                  <RegisterPage />
                </LazySuspense>
              </PublicRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <LazySuspense>
                  <ForgotPasswordPage />
                </LazySuspense>
              </PublicRoute>
            }
          />
          <Route
            path="/reset-password"
            element={
              <PublicRoute>
                <LazySuspense>
                  <ResetPasswordPage />
                </LazySuspense>
              </PublicRoute>
            }
          />

          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route
              path="/dashboard"
              element={
                <Suspense
                  fallback={
                    <>
                      <SkeletonKPI count={6} />
                      <SkeletonChart height={250} />
                    </>
                  }
                >
                  <DashboardPage />
                </Suspense>
              }
            />
            <Route
              path="/pos"
              element={
                <Suspense fallback={<SkeletonPOSLayout />}>
                  <POSPage />
                </Suspense>
              }
            />
            <Route
              path="/inventory"
              element={
                <Suspense fallback={<SkeletonTablePage />}>
                  <InventoryPage />
                </Suspense>
              }
            />
            <Route
              path="/settings"
              element={
                <Suspense fallback={<SkeletonForm />}>
                  <SettingsPage />
                </Suspense>
              }
            />
            <Route
              path="/reports"
              element={
                <PlanRoute requiredPlan="intermedio" sectionName="Reportes">
                  <Suspense fallback={<SkeletonReports />}>
                    <ReportsPage />
                  </Suspense>
                </PlanRoute>
              }
            />
            <Route
              path="/users"
              element={
                <Suspense fallback={<SkeletonTablePage tabs={0} kpi={3} />}>
                  <UsersPage />
                </Suspense>
              }
            />
            <Route
              path="/customers"
              element={
                <PlanRoute requiredPlan="pro" sectionName="Gestión de Clientes">
                  <Suspense fallback={<SkeletonTablePage tabs={0} kpi={3} />}>
                    <CustomersPage />
                  </Suspense>
                </PlanRoute>
              }
            />
            <Route
              path="/accounts-payable"
              element={
                <PlanRoute requiredPlan="pro" sectionName="Cuentas por Pagar">
                  <Suspense fallback={<SkeletonTablePage tabs={0} kpi={3} />}>
                    <AccountsPayablePage />
                  </Suspense>
                </PlanRoute>
              }
            />
            <Route
              path="/accounts-receivable"
              element={
                <PlanRoute requiredPlan="pro" sectionName="Cuentas por Cobrar">
                  <Suspense fallback={<SkeletonTablePage tabs={0} kpi={3} />}>
                    <AccountsReceivablePage />
                  </Suspense>
                </PlanRoute>
              }
            />
            <Route
              path="/cash-register"
              element={
                <PlanRoute requiredPlan="pro" sectionName="Caja">
                  <Suspense fallback={<SkeletonTablePage tabs={0} kpi={3} />}>
                    <CashRegisterPage />
                  </Suspense>
                </PlanRoute>
              }
            />
            <Route
              path="/sales"
              element={
                <PlanRoute requiredPlan="intermedio" sectionName="Historial de Ventas">
                  <Suspense fallback={<SkeletonTablePage tabs={0} kpi={3} />}>
                    <SalesHistoryPage />
                  </Suspense>
                </PlanRoute>
              }
            />
            <Route
              path="/expenses"
              element={
                <PlanRoute requiredPlan="pro" sectionName="Gastos">
                  <Suspense fallback={<SkeletonTablePage tabs={0} kpi={3} />}>
                    <ExpensesPage />
                  </Suspense>
                </PlanRoute>
              }
            />
            <Route
              path="/credit-notes"
              element={
                <PlanRoute requiredPlan="pro" sectionName="Notas de Crédito">
                  <Suspense fallback={<SkeletonTablePage tabs={0} kpi={3} />}>
                    <CreditNotesPage />
                  </Suspense>
                </PlanRoute>
              }
            />
            <Route
              path="/net-profit"
              element={
                <PlanRoute requiredPlan="intermedio" sectionName="Utilidad Neta">
                  <Suspense fallback={<SkeletonReports chartCount={2} />}>
                    <NetProfitPage />
                  </Suspense>
                </PlanRoute>
              }
            />
            <Route
              path="/low-stock"
              element={
                <Suspense fallback={<SkeletonTablePage tabs={0} kpi={3} />}>
                  <LowStockPage />
                </Suspense>
              }
            />
            <Route
              path="/best-sellers"
              element={
                <PlanRoute requiredPlan="intermedio" sectionName="Best-Sellers">
                  <Suspense fallback={<SkeletonTablePage tabs={2} kpi={3} />}>
                    <BestSellersPage />
                  </Suspense>
                </PlanRoute>
              }
            />
            <Route
              path="/warehouses"
              element={
                <PlanRoute requiredPlan="pro" sectionName="Almacenes">
                  <Suspense fallback={<SkeletonTablePage tabs={0} kpi={3} />}>
                    <WarehousePage />
                  </Suspense>
                </PlanRoute>
              }
            />
            <Route
              path="/license-tool"
              element={
                <AdminRoute>
                  <Suspense fallback={<SkeletonForm fields={4} />}>
                    <LicenseToolPage />
                  </Suspense>
                </AdminRoute>
              }
            />
            <Route
              path="/agenda"
              element={
                <PlanRoute requiredPlan="pro" sectionName="Agenda Digital">
                  <Suspense fallback={<SkeletonCards count={6} />}>
                    <AgendaDigitalPage />
                  </Suspense>
                </PlanRoute>
              }
            />
            <Route
              path="/admin/tenants"
              element={
                <AdminRoute>
                  <Suspense fallback={<SkeletonTablePage tabs={0} kpi={3} />}>
                    <AdminTenantsPage />
                  </Suspense>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/saas-dashboard"
              element={
                <AdminRoute>
                  <Suspense fallback={<SkeletonTablePage tabs={2} kpi={0} />}>
                    <SuperAdminDashboard />
                  </Suspense>
                </AdminRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <Suspense fallback={<SkeletonTablePage tabs={0} kpi={3} />}>
                  <NotificationsPage />
                </Suspense>
              }
            />
            <Route
              path="/categories"
              element={
                <Suspense fallback={<SkeletonTablePage tabs={0} kpi={3} />}>
                  <CategoriesPage />
                </Suspense>
              }
            />
            <Route
              path="/returns"
              element={
                <Suspense fallback={<SkeletonTablePage tabs={0} kpi={3} />}>
                  <ReturnsPage />
                </Suspense>
              }
            />
            <Route
              path="/warehouse-transfers"
              element={
                <Suspense fallback={<SkeletonTablePage tabs={0} kpi={3} />}>
                  <WarehouseTransfersPage />
                </Suspense>
              }
            />
            <Route
              path="/product-lots"
              element={
                <Suspense fallback={<SkeletonTablePage tabs={0} kpi={3} />}>
                  <ProductLotsPage />
                </Suspense>
              }
            />
            <Route
              path="/fiscal"
              element={
                <Suspense fallback={<SkeletonTablePage tabs={2} kpi={0} />}>
                  <FiscalPage />
                </Suspense>
              }
            />
            <Route
              path="/dead-products"
              element={
                <PlanRoute requiredPlan="intermedio" sectionName="Productos Muertos">
                  <Suspense fallback={<SkeletonTablePage tabs={0} kpi={3} />}>
                    <DeadProductsPage />
                  </Suspense>
                </PlanRoute>
              }
            />
          </Route>

          <Route
            path="/social"
            element={
              <ProtectedRoute>
                <Suspense fallback={<SkeletonCards count={6} />}>
                  <SocialPage />
                </Suspense>
              </ProtectedRoute>
            }
          />

          <Route
            path="/dev/ui"
            element={
              <ProtectedRoute>
                <Suspense fallback={<SkeletonForm fields={3} />}>
                  <UIDevCatalog />
                </Suspense>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </LicenseCheck>
    </ErrorBoundary>
  );
}
