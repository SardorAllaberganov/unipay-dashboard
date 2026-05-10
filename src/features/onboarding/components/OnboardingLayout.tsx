import type { ReactNode } from 'react';
import { Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTranslation } from 'react-i18next';
import { StepIndicator } from './StepIndicator';

interface Props {
  currentStep: number;
  totalSteps: number;
  offlineQueued?: boolean;
  actionBar: ReactNode;
  children: ReactNode;
}

export function OnboardingLayout({
  currentStep,
  totalSteps,
  offlineQueued = false,
  actionBar,
  children,
}: Props) {
  const { t } = useTranslation();
  return (
    <>
      <div className="sticky top-0 z-30 -mx-4 border-b border-border bg-background px-4 py-3 md:-mx-6 md:px-6">
        <div className="mx-auto max-w-2xl">
          <StepIndicator current={currentStep} total={totalSteps} />
        </div>
      </div>
      <div className="mx-auto max-w-2xl pb-16 pt-6 md:pt-8">
        {offlineQueued ? (
          <Alert className="mb-4">
            <Info className="size-4" aria-hidden />
            <AlertDescription>{t('onboarding.offlineQueued')}</AlertDescription>
          </Alert>
        ) : null}
        {children}
      </div>
      {actionBar}
    </>
  );
}
