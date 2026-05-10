import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Plus, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNetworkState } from '@/hooks/useNetworkState';
import { OnboardingLayout } from '../components/OnboardingLayout';
import { StepActionBar } from '../components/StepActionBar';
import { BankAccountFields } from '../components/BankAccountFields';
import { step3Schema, type Step3Values, type BankAccountValues } from '../schemas';
import { useOnboarding } from '../context/OnboardingContext';
import { useSaveOnboardingDraft } from '../hooks/useOnboardingDraft';
import { useOfflineDraftQueue } from '../hooks/useOfflineDraftQueue';

const EMPTY_ACCOUNT: BankAccountValues = {
  bankCode: '',
  bankName: '',
  mfo: '',
  iban: '',
  holderName: '',
  currency: 'UZS',
  label: '',
  isDefault: true,
};

export function Step3BankAccount(): React.JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { draft, setStepData, markStepComplete } = useOnboarding();
  const online = useNetworkState();
  const saveMutation = useSaveOnboardingDraft();
  const { queueDraft } = useOfflineDraftQueue();
  const [offlineQueued, setOfflineQueued] = useState(false);

  const schema = useMemo(() => step3Schema(t), [t]);
  const form = useForm<Step3Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      accounts:
        draft.step3?.accounts && draft.step3.accounts.length > 0
          ? draft.step3.accounts as BankAccountValues[]
          : [EMPTY_ACCOUNT],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'accounts' });

  const setDefault = (index: number) => {
    const next = form.getValues('accounts').map((a, i) => ({ ...a, isDefault: i === index }));
    form.setValue('accounts', next, { shouldValidate: true });
  };

  const persist = async (data: Step3Values): Promise<void> => {
    setStepData('step3', data);
    markStepComplete(3);
    const completed = Array.from(new Set([...draft.completedSteps, 1, 2, 3])).sort((a, b) => a - b);
    const patch = { step3: data, completedSteps: completed };
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

  const onNext = form.handleSubmit(async (data) => {
    await persist(data);
    navigate('/onboarding/4');
  });
  const onBack = () => navigate('/onboarding/2');
  const onSaveExit = form.handleSubmit(async (data) => {
    await persist(data);
    navigate('/');
  });

  return (
    <OnboardingLayout
      currentStep={3}
      totalSteps={5}
      offlineQueued={offlineQueued}
      actionBar={
        <StepActionBar
          onBack={onBack}
          onSaveExit={onSaveExit}
          onNext={onNext}
          isSubmitting={saveMutation.isPending}
        />
      }
    >
      <h1 className="mb-6 text-page-title">{t('onboarding.step3.title')}</h1>
      <Form {...form}>
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          {fields.map((f, i) => (
            <BankAccountFields
              key={f.id}
              index={i}
              canRemove={fields.length > 1}
              onRemove={() => remove(i)}
              onSetDefault={setDefault}
            />
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={() =>
              append({ ...EMPTY_ACCOUNT, isDefault: fields.length === 0 })
            }
          >
            <Plus className="size-4" aria-hidden />
            {t('onboarding.step3.addAccount')}
          </Button>

          {form.formState.errors.accounts?.message ? (
            <Alert variant="destructive">
              <AlertDescription>
                {form.formState.errors.accounts.message as string}
              </AlertDescription>
            </Alert>
          ) : null}

          <Alert>
            <Info className="size-4" aria-hidden />
            <AlertDescription>{t('onboarding.step3.testTransferNote')}</AlertDescription>
          </Alert>
        </form>
      </Form>
    </OnboardingLayout>
  );
}
