import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface Props {
  current: number;
  total: number;
}

export function StepIndicator({ current, total }: Props) {
  const { t } = useTranslation();
  return (
    <div className="space-y-2">
      <div className="tabular text-sm text-muted-foreground">
        {t('onboarding.stepLabel', { current, total })}
      </div>
      <div className="flex gap-1" role="progressbar" aria-valuenow={current} aria-valuemin={1} aria-valuemax={total}>
        {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
          <div
            key={n}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors duration-base ease-standard',
              n <= current ? 'bg-brand-600' : 'bg-muted'
            )}
          />
        ))}
      </div>
    </div>
  );
}
