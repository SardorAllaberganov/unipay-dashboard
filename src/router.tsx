import { useEffect } from 'react';
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
import { signOut, useIdleTimeout, useSession } from '@/lib/auth';
import { useMaintenanceState } from '@/lib/maintenanceState';
import SignInPage from '@/features/auth/pages/SignInPage';
import ForgotPasswordPage from '@/features/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/features/auth/pages/ResetPasswordPage';
import OnboardingPage from '@/features/onboarding/pages/OnboardingPage';
import { useOnboardingGuard } from '@/features/onboarding/hooks/useOnboardingGuard';
import DashboardPage from '@/features/dashboard/pages/DashboardPage';
import OrganizationLayout from '@/features/organization/pages/OrganizationLayout';
import ProfilePage from '@/features/organization/pages/ProfilePage';
import DepartmentsPage from '@/features/organization/pages/DepartmentsPage';
import BankAccountsPage from '@/features/organization/pages/BankAccountsPage';
import BrandingPage from '@/features/organization/pages/BrandingPage';
import AddBankAccountPage from '@/features/organization/pages/AddBankAccountPage';
import AddDepartmentPage from '@/features/organization/pages/AddDepartmentPage';
import StaffListPage from '@/features/staff/pages/StaffListPage';
import StaffDetailPage from '@/features/staff/pages/StaffDetailPage';
import StudentsListPage from '@/features/students/pages/StudentsListPage';
import AddStudentPage from '@/features/students/pages/AddStudentPage';
import StudentProfilePage from '@/features/students/pages/StudentProfilePage';
import EditStudentPage from '@/features/students/pages/EditStudentPage';
import SchedulesPage from '@/features/students/pages/SchedulesPage';
import ImportStudentsPage from '@/features/students/pages/ImportStudentsPage';
import { TransactionsPage } from '@/features/payments/pages/TransactionsPage';
import { TransactionDetailPage } from '@/features/payments/pages/TransactionDetailPage';
import { PendingOverduePage } from '@/features/payments/pages/PendingOverduePage';
import { RefundsPage } from '@/features/payments/pages/RefundsPage';
import ReportsLayout from '@/features/reports/pages/ReportsLayout';
import SummaryPage from '@/features/reports/pages/SummaryPage';
import ExportPage from '@/features/reports/pages/ExportPage';
import PayoutsHistoryPage from '@/features/payouts/pages/PayoutsHistoryPage';
import PayoutDetailPage from '@/features/payouts/pages/PayoutDetailPage';
import RequestPayoutPage from '@/features/payouts/pages/RequestPayoutPage';
import Placeholder from '@/pages/Placeholder';

const KNOWN_PATH_PREFIXES = [
  '/organization',
  '/staff',
  '/students',
  '/payments',
  '/reports',
  '/payouts',
  '/settings',
  '/onboarding',
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
          <Route path="/settings" element={<Placeholder />} />

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

          <Route path="*" element={<NotFoundState />} />
        </Routes>
      </OnboardingGuardWrapper>
    </SystemErrorBoundary>
  );
}
