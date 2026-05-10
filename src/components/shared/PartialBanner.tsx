import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface Props {
  shown: number;
  total: number;
  className?: string;
}

export function PartialBanner({ shown, total, className }: Props) {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      className={cn(
        'flex items-center gap-2 rounded-md border border-warning/30 bg-warning-light px-3 py-2 text-sm text-warning-foreground',
        className
      )}
    >
      <AlertTriangle className="size-4 shrink-0" aria-hidden />
      <span>{t('common.partial', { shown, total })}</span>
    </div>
  );
}
