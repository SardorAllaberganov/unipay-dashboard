import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNetworkState } from '@/hooks/useNetworkState';
import { OnboardingLayout } from '../components/OnboardingLayout';
import { StepActionBar } from '../components/StepActionBar';
import {
  ORG_TYPES,
  LEGAL_FORMS,
  step1Schema,
  type Step1Values,
} from '../schemas';
import { useOnboarding } from '../context/OnboardingContext';
import { UZ_REGIONS } from '../fixtures/uzRegions';
import { useSaveOnboardingDraft } from '../hooks/useOnboardingDraft';
import { useOfflineDraftQueue } from '../hooks/useOfflineDraftQueue';

export function Step1OrgInfo(): React.JSX.Element {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { draft, setStepData, markStepComplete } = useOnboarding();
  const online = useNetworkState();
  const saveMutation = useSaveOnboardingDraft();
  const { queueDraft } = useOfflineDraftQueue();
  const [offlineQueued, setOfflineQueued] = useState(false);

  const schema = useMemo(() => step1Schema(t), [t]);
  const form = useForm<Step1Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      nameRu: draft.step1?.nameRu ?? '',
      nameUz: draft.step1?.nameUz ?? '',
      type: draft.step1?.type,
      legalForm: draft.step1?.legalForm,
      tin: draft.step1?.tin ?? '',
      foundedYear: draft.step1?.foundedYear,
      region: draft.step1?.region ?? '',
      address: draft.step1?.address ?? '',
      website: draft.step1?.website ?? '',
    },
  });

  const persist = async (data: Step1Values): Promise<void> => {
    setStepData('step1', data);
    markStepComplete(1);
    const dedupedCompleted = Array.from(new Set([...draft.completedSteps, 1])).sort(
      (a, b) => a - b
    );
    const patch = { step1: data, completedSteps: dedupedCompleted };
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
    navigate('/onboarding/2');
  });

  const onSaveExit = form.handleSubmit(async (data) => {
    await persist(data);
    navigate('/');
  });

  const localeName = i18n.language === 'uz' ? 'nameUz' : 'nameRu';

  return (
    <OnboardingLayout
      currentStep={1}
      totalSteps={5}
      offlineQueued={offlineQueued}
      actionBar={
        <StepActionBar
          onSaveExit={onSaveExit}
          onNext={onNext}
          isSubmitting={saveMutation.isPending}
        />
      }
    >
      <h1 className="mb-6 text-page-title">{t('onboarding.step1.title')}</h1>
      <Form {...form}>
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="nameRu"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('onboarding.step1.nameRuLabel')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nameUz"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('onboarding.step1.nameUzLabel')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('onboarding.step1.typeLabel')}</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('onboarding.step1.typePlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {ORG_TYPES.map((v) => (
                          <SelectItem key={v} value={v}>
                            {t(`onboarding.orgTypes.${v}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="legalForm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('onboarding.step1.legalFormLabel')}</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('onboarding.step1.legalFormPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {LEGAL_FORMS.map((v) => (
                          <SelectItem key={v} value={v}>
                            {t(`onboarding.legalForms.${v}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="tin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('onboarding.step1.tinLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      maxLength={9}
                      inputMode="numeric"
                      className="tabular"
                      onChange={(e) => field.onChange(e.target.value.replace(/\D/g, '').slice(0, 9))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="foundedYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('onboarding.step1.foundedYearLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1900}
                      max={new Date().getFullYear()}
                      className="tabular"
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(e.target.value === '' ? undefined : Number(e.target.value))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="region"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('onboarding.step1.regionLabel')}</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('onboarding.step1.regionPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {UZ_REGIONS.map((r) => (
                        <SelectItem key={r.code} value={r.code}>
                          {localeName === 'nameUz' ? r.nameUz : r.nameRu}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('onboarding.step1.addressLabel')}</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={2} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('onboarding.step1.websiteLabel')}</FormLabel>
                <FormControl>
                  <Input type="url" placeholder="https://" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </OnboardingLayout>
  );
}
