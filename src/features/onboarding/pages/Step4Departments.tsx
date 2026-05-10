import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AlertCircle, FolderTree, RefreshCw, WifiOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { useNetworkState } from '@/hooks/useNetworkState';
import { OnboardingLayout } from '../components/OnboardingLayout';
import { StepActionBar } from '../components/StepActionBar';
import { DepartmentTreeEditor } from '../components/DepartmentTreeEditor';
import {
  TEMPLATE_TYPES,
  type DepartmentNode,
  type Step4Values,
  type TemplateType,
} from '../schemas';
import { useOnboarding } from '../context/OnboardingContext';
import { useSaveOnboardingDraft } from '../hooks/useOnboardingDraft';
import { useOfflineDraftQueue } from '../hooks/useOfflineDraftQueue';
import { getTemplate } from '../api';

type Mode = 'skip' | 'template';

export function Step4Departments(): React.JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { draft, setStepData, markStepComplete } = useOnboarding();
  const online = useNetworkState();
  const saveMutation = useSaveOnboardingDraft();
  const { queueDraft } = useOfflineDraftQueue();
  const [offlineQueued, setOfflineQueued] = useState(false);

  const draftStep4 = draft.step4;
  const initialMode: Mode = draftStep4?.mode ?? 'skip';
  const initialTemplate: TemplateType | undefined =
    draftStep4?.mode === 'template' ? draftStep4.templateType : undefined;
  const initialTree: DepartmentNode[] =
    draftStep4?.mode === 'template' ? (draftStep4.tree as DepartmentNode[]) : [];

  const [mode, setMode] = useState<Mode>(initialMode);
  const [templateType, setTemplateType] = useState<TemplateType | undefined>(initialTemplate);
  const [tree, setTree] = useState<DepartmentNode[]>(initialTree);
  const [hydrated, setHydrated] = useState(initialTree.length > 0);

  const templateQuery = useQuery({
    queryKey: ['onboarding', 'template', templateType],
    queryFn: () => getTemplate(templateType as TemplateType),
    enabled: mode === 'template' && !!templateType && !hydrated,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (templateQuery.data && !hydrated) {
      setTree(templateQuery.data);
      setHydrated(true);
    }
  }, [templateQuery.data, hydrated]);

  const handleTemplateChange = (next: TemplateType): void => {
    setTemplateType(next);
    setHydrated(false);
    setTree([]);
  };

  const buildValues = (): Step4Values =>
    mode === 'skip'
      ? { mode: 'skip' }
      : {
          mode: 'template',
          templateType: templateType as TemplateType,
          tree: tree as unknown[],
        };

  const persist = async (): Promise<void> => {
    if (mode === 'template' && (!templateType || tree.length === 0)) return;
    const data = buildValues();
    setStepData('step4', data);
    markStepComplete(4);
    const completed = Array.from(new Set([...draft.completedSteps, 1, 2, 3, 4])).sort(
      (a, b) => a - b
    );
    const patch = { step4: data, completedSteps: completed };
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

  const canProceed = mode === 'skip' || (mode === 'template' && tree.length > 0);

  const onNext = async (): Promise<void> => {
    if (!canProceed) return;
    await persist();
    navigate('/onboarding/5');
  };
  const onBack = () => navigate('/onboarding/3');
  const onSaveExit = async (): Promise<void> => {
    await persist();
    navigate('/');
  };

  return (
    <OnboardingLayout
      currentStep={4}
      totalSteps={5}
      offlineQueued={offlineQueued}
      actionBar={
        <StepActionBar
          onBack={onBack}
          onSaveExit={onSaveExit}
          onNext={onNext}
          isSubmitting={saveMutation.isPending}
          saveExitDisabled={!canProceed && mode === 'template' && !!templateType}
        />
      }
    >
      <h1 className="mb-6 text-page-title">{t('onboarding.step4.title')}</h1>

      <div className="space-y-6">
        <RadioGroup
          value={mode}
          onValueChange={(v: Mode) => {
            setMode(v);
            if (v === 'skip') {
              setTemplateType(undefined);
              setTree([]);
              setHydrated(false);
            }
          }}
          className="grid gap-3"
        >
          <Label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4">
            <RadioGroupItem value="template" />
            <div>
              <div className="text-sm font-medium">{t('onboarding.step4.modeTemplate')}</div>
              <p className="text-sm text-muted-foreground">
                {t('onboarding.step4.modeTemplateHint')}
              </p>
            </div>
          </Label>
          <Label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4">
            <RadioGroupItem value="skip" />
            <div>
              <div className="text-sm font-medium">{t('onboarding.step4.modeSkip')}</div>
              <p className="text-sm text-muted-foreground">{t('onboarding.step4.modeSkipHint')}</p>
            </div>
          </Label>
        </RadioGroup>

        {mode === 'template' ? (
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block text-sm">
                {t('onboarding.step4.pickTemplate')}
              </Label>
              <RadioGroup
                value={templateType}
                onValueChange={(v: TemplateType) => handleTemplateChange(v)}
                className="flex flex-wrap gap-2"
              >
                {TEMPLATE_TYPES.map((tt) => (
                  <Label
                    key={tt}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <RadioGroupItem value={tt} />
                    {t(`onboarding.step4.templates.${tt}`)}
                  </Label>
                ))}
              </RadioGroup>
            </div>

            {/* 6 states for tree fetch */}
            {!templateType ? (
              <div className="rounded-lg border border-dashed border-border p-8 text-center">
                <FolderTree className="mx-auto size-12 text-muted-foreground" aria-hidden />
                <p className="mt-3 text-sm text-muted-foreground">
                  {t('onboarding.step4.emptyHint')}
                </p>
              </div>
            ) : !online && tree.length === 0 ? (
              <Alert variant="warning">
                <WifiOff className="size-4" aria-hidden />
                <AlertDescription>{t('onboarding.step4.offlineNoCache')}</AlertDescription>
              </Alert>
            ) : templateQuery.isLoading && !hydrated ? (
              <div className="space-y-2 rounded-lg border border-border p-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-7 w-full" />
                ))}
              </div>
            ) : templateQuery.isError && !hydrated ? (
              <Alert variant="destructive">
                <AlertCircle className="size-4" aria-hidden />
                <AlertDescription className="flex items-center justify-between gap-3">
                  <span>{t('onboarding.step4.errorFetch')}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => templateQuery.refetch()}
                  >
                    <RefreshCw className="size-4" aria-hidden />
                    {t('common.actions.retry')}
                  </Button>
                </AlertDescription>
              </Alert>
            ) : tree.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                {t('onboarding.step4.emptyTree')}
              </div>
            ) : (
              <>
                {!online ? (
                  <Alert>
                    <WifiOff className="size-4" aria-hidden />
                    <AlertDescription>{t('onboarding.step4.offlineCached')}</AlertDescription>
                  </Alert>
                ) : null}
                <div className="rounded-lg border border-border p-4">
                  <DepartmentTreeEditor nodes={tree} onChange={setTree} />
                </div>
              </>
            )}
          </div>
        ) : null}
      </div>
    </OnboardingLayout>
  );
}
