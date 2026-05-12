import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { WriteButton } from '@/components/unipay/WriteButton';

interface Props {
  onBack?: () => void;
  onSaveExit: () => void;
  onNext: () => void;
  isFinal?: boolean;
  isSubmitting?: boolean;
  saveExitDisabled?: boolean;
}

export function StepActionBar({
  onBack,
  onSaveExit,
  onNext,
  isFinal = false,
  isSubmitting = false,
  saveExitDisabled = false,
}: Props) {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/90 px-4 py-3 backdrop-blur md:left-[var(--sidebar-width,4rem)] md:px-6">
      <div className="mx-auto flex max-w-2xl flex-wrap items-center gap-2">
        {onBack ? (
          <Button type="button" variant="ghost" onClick={onBack} disabled={isSubmitting}>
            <ArrowLeft className="size-4" aria-hidden />
            {t('onboarding.actions.back')}
          </Button>
        ) : null}
        <WriteButton
          type="button"
          variant="outline"
          onClick={onSaveExit}
          disabled={isSubmitting || saveExitDisabled}
        >
          {t('onboarding.actions.saveExit')}
        </WriteButton>
        <div className="flex-1" />
        {isFinal ? (
          <WriteButton type="button" onClick={onNext} loading={isSubmitting}>
            <Check className="size-4" aria-hidden />
            {t('onboarding.actions.finish')}
          </WriteButton>
        ) : (
          <WriteButton type="button" onClick={onNext} loading={isSubmitting}>
            {t('onboarding.actions.next')}
            <ArrowRight className="size-4" aria-hidden />
          </WriteButton>
        )}
      </div>
    </div>
  );
}
