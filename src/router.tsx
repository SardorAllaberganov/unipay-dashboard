// Router with route-level code-splitting. Every feature page is `React.lazy()`-loaded
// so the initial bundle ships only the AppShell + system primitives + sign-in flow.
// Each lazy import becomes its own chunk during `vite build`. <Suspense> wraps
// <AppRoutes> with a lightweight skeleton fallback so a route swap doesn't blank
// the layout shell.
//
// Auth pages (sign-in / forgot / reset) stay eager so the unauthenticated entry
// path has no flash-of-skeleton — they're the absolute critical path. Likewise
// the system primitives, error boundary, and maintenance gate stay eager so
// outages don't depend on a chunk fetch.
import { Suspense, lazy, useEffect } from 'react';
import {
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { SystemErrorBoundary } from '@/components/system/SystemErrorBoundary';
import { NotFoundState } from '@/components/system/NotFoundState';
import { ServerErrorState } from '@/components/system/ServerErrorState';
import { ForbiddenState } from '@/components/system/ForbiddenState';
import { OfflineState } from '@/components/system/OfflineState';
import { MaintenanceState } from '@/components/system/MaintenanceState';
import ErrorBoundaryPreview from '@/components/system/ErrorBoundaryPreview';
import { Skeleton } from '@/components/ui/skeleton';
import { signOut, useIdleTimeout, useSession } from '@/lib/auth';
import { useMaintenanceState } from '@/lib/maintenanceState';
import SignInPage from '@/features/auth/pages/SignInPage';
import ForgotPasswordPage from '@/features/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/features/auth/pages/ResetPasswordPage';
import { useOnboardingGuard } from '@/features/onboarding/hooks/useOnboardingGuard';

// ────────────────────────────────────────────────────────────────────────────
// Lazy feature routes. Each `lazy(() => import(...))` produces its own chunk.
// Named exports are normalized to a `default` export via the inner Promise.
// ────────────────────────────────────────────────────────────────────────────
const OnboardingPage = lazy(() => import('@/features/onboarding/pages/OnboardingPage'));
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'));

const OrganizationLayout = lazy(() => import('@/features/organization/pages/OrganizationLayout'));
const ProfilePage = lazy(() => import('@/features/organization/pages/ProfilePage'));
const DepartmentsPage = lazy(() => import('@/features/organization/pages/DepartmentsPage'));
const BankAccountsPage = lazy(() => import('@/features/organization/pages/BankAccountsPage'));
const BrandingPage = lazy(() => import('@/features/organization/pages/BrandingPage'));
const AddBankAccountPage = lazy(() => import('@/features/organization/pages/AddBankAccountPage'));
const AddDepartmentPage = lazy(() => import('@/features/organization/pages/AddDepartmentPage'));

const StaffListPage = lazy(() => import('@/features/staff/pages/StaffListPage'));
const StaffDetailPage = lazy(() => import('@/features/staff/pages/StaffDetailPage'));

const StudentsListPage = lazy(() => import('@/features/students/pages/StudentsListPage'));
const AddStudentPage = lazy(() => import('@/features/students/pages/AddStudentPage'));
const StudentProfilePage = lazy(() => import('@/features/students/pages/StudentProfilePage'));
const EditStudentPage = lazy(() => import('@/features/students/pages/EditStudentPage'));
const SchedulesPage = lazy(() => import('@/features/students/pages/SchedulesPage'));
const ImportStudentsPage = lazy(() => import('@/features/students/pages/ImportStudentsPage'));

// Payments pages use named exports — wrap in a default-shaped Promise.
const TransactionsPage = lazy(() =>
  import('@/features/payments/pages/TransactionsPage').then((m) => ({ default: m.TransactionsPage })),
);
const TransactionDetailPage = lazy(() =>
  import('@/features/payments/pages/TransactionDetailPage').then((m) => ({
    default: m.TransactionDetailPage,
  })),
);
const PendingOverduePage = lazy(() =>
  import('@/features/payments/pages/PendingOverduePage').then((m) => ({ default: m.PendingOverduePage })),
);
const RefundsPage = lazy(() =>
  import('@/features/payments/pages/RefundsPage').then((m) => ({ default: m.RefundsPage })),
);

const ReportsLayout = lazy(() => import('@/features/reports/pages/ReportsLayout'));
const SummaryPage = lazy(() => import('@/features/reports/pages/SummaryPage'));
const ExportPage = lazy(() => import('@/features/reports/pages/ExportPage'));

const PayoutsHistoryPage = lazy(() => import('@/features/payouts/pages/PayoutsHistoryPage'));
const PayoutDetailPage = lazy(() => import('@/features/payouts/pages/PayoutDetailPage'));
const RequestPayoutPage = lazy(() => import('@/features/payouts/pages/RequestPayoutPage'));

const SettingsLayout = lazy(() => import('@/features/settings/pages/SettingsLayout'));
const GeneralTab = lazy(() => import('@/features/settings/pages/GeneralTab'));
const SecurityTab = lazy(() => import('@/features/settings/pages/SecurityTab'));
const ApiTab = lazy(() => import('@/features/settings/pages/ApiTab'));
const NotificationsTab = lazy(() => import('@/features/settings/pages/NotificationsTab'));
const BillingTab = lazy(() => import('@/features/settings/pages/BillingTab'));
const AuditTab = lazy(() => import('@/features/settings/pages/AuditTab'));
const PreferencesTab = lazy(() => import('@/features/settings/pages/PreferencesTab'));
const IntegrationsTab = lazy(() => import('@/features/settings/pages/IntegrationsTab'));

const LockedFeaturePage = lazy(() => import('@/features/coming-soon/pages/LockedFeaturePage'));

const KNOWN_PATH_PREFIXES = [
  '/organization',
  '/staff',
  '/students',
  '/payments',
  '/reports',
  '/payouts',
  '/settings',
  '/onboarding',
  '/locked',
  '/system/',
];

function isKnownPath(pathname: string): boolean {
  if (
    pathname === '/' ||
    pathname === '/sign-in' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password'
  ) {
    return true;
  }
  return KNOWN_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function PathAwareAuthGuard({ children }: { children: React.ReactNode }) {
  const session = useSession();
  const location = useLocation();
  if (!session && !isKnownPath(location.pathname)) {
    return <NotFoundState fullBleed />;
  }
  return <AuthGuard>{children}</AuthGuard>;
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const session = useSession();
  const idle = useIdleTimeout();
  const location = useLocation();
  useEffect(() => {
    if (session && idle === 'idle') signOut({ reason: 'session_expired' });
  }, [session, idle]);
  if (!session) {
    return <Navigate to={`/sign-in?next=${encodeURIComponent(location.pathname)}`} replace />;
  }
  return <AppShell>{children}</AppShell>;
}

function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const m = useMaintenanceState();
  const loc = useLocation();
  const isPreview = loc.pathname.startsWith('/system/preview');
  return m.active && !isPreview ? <MaintenanceState /> : <>{children}</>;
}

/** Minimal layout-shaped skeleton shown while a feature chunk loads. */
function RouteFallback() {
  return (
    <div className="space-y-6" role="status" aria-live="polite">
      <Skeleton className="h-9 w-48" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-72 w-full" />
    </div>
  );
}

export function Router() {
  return (
    <MaintenanceGate>
      <Routes>
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="*"
          element={
            <PathAwareAuthGuard>
              <AppRoutes />
            </PathAwareAuthGuard>
          }
        />
      </Routes>
    </MaintenanceGate>
  );
}

function OnboardingGuardWrapper({ children }: { children: React.ReactNode }) {
  useOnboardingGuard();
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <SystemErrorBoundary>
      <OnboardingGuardWrapper>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/onboarding/:step" element={<OnboardingPage />} />
            <Route path="/organization" element={<OrganizationLayout />}>
              <Route index element={<Navigate to="profile" replace />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="departments" element={<DepartmentsPage />} />
              <Route path="bank-accounts" element={<BankAccountsPage />} />
              <Route path="branding" element={<BrandingPage />} />
            </Route>
            <Route
              path="/organization/bank-accounts/new"
              element={<AddBankAccountPage />}
            />
            <Route
              path="/organization/departments/new"
              element={<AddDepartmentPage />}
            />
            <Route path="/staff" element={<StaffListPage />} />
            <Route path="/staff/:id" element={<StaffDetailPage />} />
            <Route path="/students" element={<StudentsListPage />} />
            <Route path="/students/new" element={<AddStudentPage />} />
            <Route path="/students/import" element={<ImportStudentsPage />} />
            <Route path="/students/schedules" element={<SchedulesPage />} />
            <Route path="/students/:id" element={<StudentProfilePage />} />
            <Route path="/students/:id/edit" element={<EditStudentPage />} />
            <Route path="/payments/transactions" element={<TransactionsPage />} />
            <Route path="/payments/transactions/:id" element={<TransactionDetailPage />} />
            <Route path="/payments/pending" element={<PendingOverduePage />} />
            <Route path="/payments/refunds" element={<RefundsPage />} />
            <Route path="/reports" element={<ReportsLayout />}>
              <Route index element={<Navigate to="summary" replace />} />
              <Route path="summary" element={<SummaryPage />} />
              <Route path="export" element={<ExportPage />} />
            </Route>
            <Route path="/payouts" element={<PayoutsHistoryPage />} />
            <Route path="/payouts/request" element={<RequestPayoutPage />} />
            <Route path="/payouts/:id" element={<PayoutDetailPage />} />
            <Route path="/settings" element={<SettingsLayout />}>
              <Route index element={<Navigate to="general" replace />} />
              <Route path="general" element={<GeneralTab />} />
              <Route path="security" element={<SecurityTab />} />
              <Route path="api" element={<ApiTab />} />
              <Route path="integrations" element={<IntegrationsTab />} />
              <Route path="notifications" element={<NotificationsTab />} />
              <Route path="billing" element={<BillingTab />} />
              <Route path="audit" element={<AuditTab />} />
              <Route path="preferences" element={<PreferencesTab />} />
            </Route>
            <Route path="/locked/:feature" element={<LockedFeaturePage />} />

            {/* System preview routes for QA */}
            <Route path="/system/preview/404" element={<NotFoundState />} />
            <Route
              path="/system/preview/500"
              element={<ServerErrorState referenceId="8a7c-2f1e" onRetry={() => undefined} />}
            />
            <Route path="/system/preview/403" element={<ForbiddenState preview />} />
            <Route path="/system/preview/offline" element={<OfflineState forceVisible />} />
            <Route
              path="/system/preview/maintenance"
              element={
                <MaintenanceState
                  startedAtOverride={Date.now() - 600_000}
                  estimatedEndAtOverride={Date.now() + 1_800_000}
                />
              }
            />
            <Route path="/system/preview/error-boundary" element={<ErrorBoundaryPreview />} />

            <Route path="*" element={<NotFoundState />} />
          </Routes>
        </Suspense>
      </OnboardingGuardWrapper>
    </SystemErrorBoundary>
  );
}
