import { AlertCircle, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface Props {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({ title, description, onRetry, retryLabel, className }: Props) {
  const { t } = useTranslation();
  return (
    <div
      role="alert"
      className={cn(
        'flex w-full flex-col items-center justify-center gap-3 rounded-lg border border-danger/30 bg-danger-light/40 px-6 py-10 text-center',
        className
      )}
    >
      <AlertCircle className="size-10 text-danger" aria-hidden />
      <div>
        <h3 className="text-lg font-semibold text-danger-foreground">
          {title ?? t('common.states.errorTitle')}
        </h3>
        <p className="mt-1 max-w-md text-sm text-danger-foreground/80">
          {description ?? t('common.states.errorBody')}
        </p>
      </div>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry}>
          <RotateCw className="size-4" aria-hidden />
          {retryLabel ?? t('common.actions.retry')}
        </Button>
      ) : null}
    </div>
  );
}
