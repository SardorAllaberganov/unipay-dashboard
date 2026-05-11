// Summary row beneath the Transactions table. Flows below the table inside the same surface
// shell; visually demarcated by `border-t border-border`. (Was previously `sticky bottom-0`
// but that didn't compose with the wrapping `overflow-hidden` container, so the position was
// inert — dropped.)
import { useTranslation } from 'react-i18next';
import { AmountDisplay } from '@/components/shared/AmountDisplay';
import type { Money } from '@/types/domain';

interface Props {
  charged: Money;
  commission: Money;
  net: Money;
  /** When true, the footer drops its top-border (parent owns the chrome). */
  standalone?: boolean;
}

export function SummaryFooter({ charged, commission, net, standalone }: Props) {
  const { t } = useTranslation();
  return (
    <div
      className={
        standalone
          ? 'flex flex-col gap-2 bg-card px-4 py-3 md:flex-row md:items-center md:justify-between md:px-5'
          : 'flex flex-col gap-2 border-t border-border bg-card px-4 py-3 md:flex-row md:items-center md:justify-between md:px-5'
      }
      role="contentinfo"
      aria-label={t('payments.list.summary.label')}
    >
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {t('payments.list.summary.label')}
      </span>
      <dl className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <div className="flex items-baseline gap-2">
          <dt className="text-muted-foreground">{t('payments.list.summary.totalCharged')}</dt>
          <dd className="font-mono font-semibold tabular text-foreground">
            <AmountDisplay value={charged} />
          </dd>
        </div>
        <div className="flex items-baseline gap-2">
          <dt className="text-muted-foreground">{t('payments.list.summary.totalCommission')}</dt>
          <dd className="font-mono tabular text-muted-foreground">
            <AmountDisplay value={commission} muted />
          </dd>
        </div>
        <div className="flex items-baseline gap-2">
          <dt className="text-muted-foreground">{t('payments.list.summary.totalNet')}</dt>
          <dd className="font-mono font-semibold tabular text-foreground">
            <AmountDisplay value={net} />
          </dd>
        </div>
      </dl>
    </div>
  );
}
