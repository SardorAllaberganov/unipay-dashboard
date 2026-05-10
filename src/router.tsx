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
          <Route path="/organization" element={<Placeholder />} />
          <Route path="/staff" element={<Placeholder />} />
          <Route path="/students" element={<Placeholder />} />
          <Route path="/students/:id" element={<Placeholder />} />
          <Route path="/payments/transactions" element={<Placeholder />} />
          <Route path="/payments/transactions/:id" element={<Placeholder />} />
          <Route path="/payments/pending" element={<Placeholder />} />
          <Route path="/payments/refunds" element={<Placeholder />} />
          <Route path="/reports" element={<Placeholder />} />
          <Route path="/payouts" element={<Placeholder />} />
          <Route path="/payouts/:id" element={<Placeholder />} />
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
