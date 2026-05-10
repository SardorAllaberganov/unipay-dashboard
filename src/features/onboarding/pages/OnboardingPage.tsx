import { useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppShell } from '@/components/layout/AppShellContext';
import { LoadingCard } from '@/components/shared/LoadingCard';
import { ErrorState } from '@/components/shared/ErrorState';
import { OnboardingProvider, useOnboarding } from '../context/OnboardingContext';
import { useOnboardingDraftQuery } from '../hooks/useOnboardingDraft';
import { Step1OrgInfo } from './Step1OrgInfo';
import { Step2ContactBranding } from './Step2ContactBranding';
import { Step3BankAccount } from './Step3BankAccount';
import { Step4Departments } from './Step4Departments';
import { Step5InviteStaff } from './Step5InviteStaff';

export default function OnboardingPage(): React.JSX.Element {
  const { t } = useTranslation();
  const { setOnboardingActive } = useAppShell();
  const draftQuery = useOnboardingDraftQuery();

  useEffect(() => {
    setOnboardingActive(true);
    return () => setOnboardingActive(false);
  }, [setOnboardingActive]);

  if (draftQuery.isLoading) return <LoadingCard />;
  if (draftQuery.isError || !draftQuery.data) {
    return (
      <ErrorState
        title={t('onboarding.errors.draftLoadTitle')}
        description={t('onboarding.errors.draftLoadBody')}
        onRetry={() => draftQuery.refetch()}
      />
    );
  }

  return (
    <OnboardingProvider initialDraft={draftQuery.data}>
      <StepGuardedSwitch />
    </OnboardingProvider>
  );
}

function StepGuardedSwitch(): React.JSX.Element {
  const { step } = useParams();
  const { draft } = useOnboarding();
  const requested = Number(step);

  if (!Number.isInteger(requested) || requested < 1 || requested > 5) {
    return <Navigate to="/onboarding/1" replace />;
  }

  const max = draft.completedSteps.length > 0 ? Math.max(...draft.completedSteps) : 0;
  const allowed = Math.min(5, max + 1);
  if (requested > allowed) {
    return <Navigate to={`/onboarding/${allowed}`} replace />;
  }

  switch (requested) {
    case 1:
      return <Step1OrgInfo />;
    case 2:
      return <Step2ContactBranding />;
    case 3:
      return <Step3BankAccount />;
    case 4:
      return <Step4Departments />;
    case 5:
      return <Step5InviteStaff />;
    default:
      return <Navigate to="/onboarding/1" replace />;
  }
}
