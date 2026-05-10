import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { updateUser } from '@/lib/auth';
import { useOnboardingComplete } from '../hooks/useOnboardingComplete';

export function SkipSetupButton(): React.JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const completeMutation = useOnboardingComplete();

  const handleConfirm = async (): Promise<void> => {
    try {
      await completeMutation.mutateAsync();
    } catch {
      // Even if the server call fails, flipping the local flag unblocks the user;
      // the backend can reconcile on next session.
    }
    updateUser({ onboardingComplete: true });
    setOpen(false);
    toast.success(t('onboarding.skipSetup.toast'));
    navigate('/', { replace: true });
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        disabled={completeMutation.isPending}
      >
        {t('onboarding.skipSetup.action')}
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={t('onboarding.skipSetup.title')}
        description={t('onboarding.skipSetup.body')}
        confirmLabel={t('onboarding.skipSetup.confirm')}
        loading={completeMutation.isPending}
        onConfirm={() => void handleConfirm()}
      />
    </>
  );
}
