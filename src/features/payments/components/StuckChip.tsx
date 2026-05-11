// Warning chip rendered next to a pending StatusBadge when the transaction has been
// pending > 10 minutes. Paired with the StatusBadge so the warning never relies on color alone.
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export function StuckChip({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-md bg-warning-50 px-2 py-0.5 text-xs font-medium text-warning-700',
        className,
      )}
      role="status"
      aria-label={t('payments.list.stuckAria')}
    >
      <AlertTriangle className="size-3" aria-hidden />
      {t('payments.list.stuckChip')}
    </span>
  );
}
