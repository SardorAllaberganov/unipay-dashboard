// Small chip indicating a manual-entry transaction. Surfaces alongside <ChannelBadge channel="manual"/>.
import { Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export function ManualChip({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-md bg-info-50 px-2 py-0.5 text-xs font-medium text-info-700',
        className,
      )}
    >
      <Pencil className="size-3" aria-hidden />
      {t('payments.list.manualChip')}
    </span>
  );
}
