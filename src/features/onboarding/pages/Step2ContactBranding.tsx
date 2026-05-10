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
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Eye } from 'lucide-react';
import { useNetworkState } from '@/hooks/useNetworkState';
import { useSession } from '@/lib/auth';
import { OnboardingLayout } from '../components/OnboardingLayout';
import { StepActionBar } from '../components/StepActionBar';
import { PhoneInput } from '../components/PhoneInput';
import { ColorPicker } from '../components/ColorPicker';
import { LogoUploader } from '../components/LogoUploader';
import { ReceiptPreview } from '../components/ReceiptPreview';
import { step2Schema, type Step2Values } from '../schemas';
import { useOnboarding } from '../context/OnboardingContext';
import { useSaveOnboardingDraft } from '../hooks/useOnboardingDraft';
import { useOfflineDraftQueue } from '../hooks/useOfflineDraftQueue';

const RECEIPT_FOOTER_MAX = 200;

export function Step2ContactBranding(): React.JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const session = useSession();
  const { draft, setStepData, markStepComplete } = useOnboarding();
  const online = useNetworkState();
  const saveMutation = useSaveOnboardingDraft();
  const { queueDraft } = useOfflineDraftQueue();
  const [offlineQueued, setOfflineQueued] = useState(false);

  const schema = useMemo(() => step2Schema(t), [t]);
  const form = useForm<Step2Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      contactEmail: draft.step2?.contactEmail ?? session?.profile.email ?? '',
      phone: draft.step2?.phone ?? '',
      logoDataUrl: draft.step2?.logoDataUrl ?? '',
      primaryColor: draft.step2?.primaryColor ?? '#1558B0',
      receiptFooter: draft.step2?.receiptFooter ?? '',
    },
  });

  const watched = form.watch();

  const persist = async (data: Step2Values): Promise<void> => {
    setStepData('step2', data);
    markStepComplete(2);
    const completed = Array.from(new Set([...draft.completedSteps, 1, 2])).sort((a, b) => a - b);
    const patch = { step2: data, completedSteps: completed };
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
    navigate('/onboarding/3');
  });
  const onBack = () => navigate('/onboarding/1');
  const onSaveExit = form.handleSubmit(async (data) => {
    await persist(data);
    navigate('/');
  });

  const orgName = draft.step1?.nameRu;

  return (
    <OnboardingLayout
      currentStep={2}
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
      <h1 className="mb-6 text-page-title">{t('onboarding.step2.title')}</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <Form {...form}>
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <FormField
              control={form.control}
              name="contactEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('onboarding.step2.contactEmailLabel')}</FormLabel>
                  <FormControl>
                    <Input type="email" autoComplete="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('onboarding.step2.phoneLabel')}</FormLabel>
                  <FormControl>
                    <PhoneInput value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="logoDataUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('onboarding.step2.logoLabel')}</FormLabel>
                  <FormControl>
                    <LogoUploader value={field.value ?? ''} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="primaryColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('onboarding.step2.primaryColorLabel')}</FormLabel>
                  <FormControl>
                    <ColorPicker value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="receiptFooter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('onboarding.step2.receiptFooterLabel')}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      maxLength={RECEIPT_FOOTER_MAX}
                      placeholder={t('onboarding.step2.receiptFooterPlaceholder')}
                    />
                  </FormControl>
                  <div className="tabular text-sm text-muted-foreground">
                    {(field.value ?? '').length} / {RECEIPT_FOOTER_MAX}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Mobile: receipt preview opens in a Sheet */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button type="button" variant="outline" className="w-full">
                    <Eye className="size-4" aria-hidden />
                    {t('onboarding.step2.previewReceipt')}
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[80vh]">
                  <SheetHeader>
                    <SheetTitle>{t('onboarding.receipt.previewLabel')}</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4">
                    <ReceiptPreview
                      orgName={orgName}
                      logoDataUrl={watched.logoDataUrl}
                      primaryColor={watched.primaryColor}
                      receiptFooter={watched.receiptFooter}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </form>
        </Form>

        {/* Desktop: live receipt preview */}
        <div className="hidden md:block">
          <div className="sticky top-32">
            <ReceiptPreview
              orgName={orgName}
              logoDataUrl={watched.logoDataUrl}
              primaryColor={watched.primaryColor}
              receiptFooter={watched.receiptFooter}
            />
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}
