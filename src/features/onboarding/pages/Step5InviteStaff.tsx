import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useNetworkState } from '@/hooks/useNetworkState';
import { updateUser } from '@/lib/auth';
import { OnboardingLayout } from '../components/OnboardingLayout';
import { StepActionBar } from '../components/StepActionBar';
import { InviteStaffFields } from '../components/InviteStaffFields';
import { step5Schema, type Step5Values, type InviteValues } from '../schemas';
import { useOnboarding } from '../context/OnboardingContext';
import { useSaveOnboardingDraft } from '../hooks/useOnboardingDraft';
import { useOnboardingComplete } from '../hooks/useOnboardingComplete';
import { useOfflineDraftQueue } from '../hooks/useOfflineDraftQueue';

const EMPTY_INVITE: InviteValues = {
  email: '',
  role: 'finance_manager',
  note: '',
};

async function fireConfetti(): Promise<void> {
  try {
    const mod = await import('canvas-confetti');
    mod.default({ particleCount: 120, spread: 80, origin: { y: 0.7 } });
  } catch {
    // ignore — graceful no-op if dynamic import fails
  }
}

export function Step5InviteStaff(): React.JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { draft, setStepData, markStepComplete } = useOnboarding();
  const online = useNetworkState();
  const saveMutation = useSaveOnboardingDraft();
  const completeMutation = useOnboardingComplete();
  const { queueDraft } = useOfflineDraftQueue();
  const [offlineQueued, setOfflineQueued] = useState(false);

  const schema = useMemo(() => step5Schema(t), [t]);
  const form = useForm<Step5Values>({
    resolver: zodResolver(schema),
    defaultValues: { invites: draft.step5?.invites ?? [] },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'invites' });

  const persistDraft = async (data: Step5Values): Promise<void> => {
    setStepData('step5', data);
    markStepComplete(5);
    const completed = Array.from(new Set([...draft.completedSteps, 1, 2, 3, 4, 5])).sort(
      (a, b) => a - b
    );
    const patch = { step5: data, completedSteps: completed };
    if (online) {
      try {
        await saveMutation.mutateAsync(patch);
      } catch {
        queueDraft(patch);
        setOfflineQueued(true);
      }
    } else {
      queueDraft(patch);
      setOfflineQueued(true);
    }
  };

  const finish = async (data: Step5Values): Promise<void> => {
    await persistDraft(data);
    await completeMutation.mutateAsync();
    updateUser({ onboardingComplete: true });
    void fireConfetti();
    toast.success(t('onboarding.completedToast'));
    navigate('/', { replace: true });
  };

  const onSkipFinish = async (): Promise<void> => {
    await finish({ invites: [] });
  };

  const onSubmitFinish = form.handleSubmit(async (data) => {
    await finish(data);
  });

  const onBack = () => navigate('/onboarding/4');
  const onSaveExit = form.handleSubmit(async (data) => {
    await persistDraft(data);
    navigate('/');
  });

  const isSubmitting = saveMutation.isPending || completeMutation.isPending;

  return (
    <OnboardingLayout
      currentStep={5}
      totalSteps={5}
      offlineQueued={offlineQueued}
      actionBar={
        <StepActionBar
          onBack={onBack}
          onSaveExit={onSaveExit}
          onNext={fields.length > 0 ? onSubmitFinish : onSkipFinish}
          isFinal
          isSubmitting={isSubmitting}
        />
      }
    >
      <h1 className="mb-2 text-page-title">{t('onboarding.step5.title')}</h1>
      <p className="mb-6 text-sm text-muted-foreground">{t('onboarding.step5.subtitle')}</p>

      <Form {...form}>
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          {fields.map((f, i) => (
            <InviteStaffFields key={f.id} index={i} onRemove={() => remove(i)} />
          ))}

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => append(EMPTY_INVITE)}
            >
              <Plus className="size-4" aria-hidden />
              {fields.length === 0
                ? t('onboarding.step5.addFirst')
                : t('onboarding.step5.addMore')}
            </Button>
            {fields.length > 0 ? (
              <Button
                type="button"
                variant="ghost"
                onClick={onSkipFinish}
                loading={isSubmitting}
              >
                {t('onboarding.step5.skip')}
              </Button>
            ) : null}
          </div>
        </form>
      </Form>
    </OnboardingLayout>
  );
}
