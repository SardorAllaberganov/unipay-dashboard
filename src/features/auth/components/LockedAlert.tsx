import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  getLockoutRemainingMs,
  isLockedOut,
  useFailedAttempts,
} from '../hooks/useFailedAttempts';

function formatRemaining(ms: number): string {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, '0')}`;
}

export function LockedAlert(): React.JSX.Element | null {
  const { t } = useTranslation();
  const state = useFailedAttempts();
  const [, setTick] = useState(0);

  useEffect(() => {
    if (state.firstFailureAt === null) return;
    const id = window.setInterval(() => setTick((v) => v + 1), 1000);
    return () => window.clearInterval(id);
  }, [state.firstFailureAt]);

  if (!isLockedOut(state)) return null;

  const remaining = getLockoutRemainingMs(state);

  return (
    <Alert variant="destructive">
      <Lock className="size-4" aria-hidden />
      <AlertDescription className="tabular">
        {t('auth.signIn.lockedOut')} ({formatRemaining(remaining)})
      </AlertDescription>
    </Alert>
  );
}
