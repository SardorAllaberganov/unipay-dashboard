// Pattern A header for the full-page transaction detail. BackLink → identity row
// (TX ID + large amount + StatusBadge + ChannelBadge) → chip row (student + receipt no.).
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BackLink } from '@/components/shared/BackLink';
import { AmountDisplay } from '@/components/shared/AmountDisplay';
import { ChannelBadge } from '@/components/shared/ChannelBadge';
import { StatusBadge, type StatusBadgeVariant } from '@/components/shared/StatusBadge';
import { TransactionIdCopy } from './TransactionIdCopy';
import { StuckChip } from './StuckChip';
import { ManualChip } from './ManualChip';
import type { Transaction } from '@/types/domain';

const STATUS_TO_VARIANT: Record<Transaction['status'], StatusBadgeVariant> = {
  paid: 'paid',
  processing: 'processing',
  pending: 'pending',
  overdue: 'overdue',
  failed: 'failed',
  refunded: 'refunded',
};

const STUCK_THRESHOLD_MS = 10 * 60 * 1000;
function isStuck(tx: Transaction): boolean {
  if (tx.status !== 'pending' && tx.status !== 'processing') return false;
  return Date.now() - new Date(tx.createdAt).getTime() > STUCK_THRESHOLD_MS;
}

interface Props {
  transaction: Transaction;
}

export function TransactionDetailHeader({ transaction }: Props) {
  const { t } = useTranslation();
  const location = useLocation();
  const backTo =
    (location.state as { from?: string } | null)?.from ?? '/payments/transactions';

  return (
    <div className="mb-6 flex flex-col gap-3">
      <BackLink to={backTo} pluralName={t('payments.backPlural')} />

      <div className="flex flex-wrap items-baseline gap-3">
        <TransactionIdCopy value={transaction.id} />
        <span className="text-2xl font-mono font-semibold tabular text-foreground md:text-3xl">
          <AmountDisplay value={transaction.amount} />
        </span>
        <StatusBadge variant={STATUS_TO_VARIANT[transaction.status]} />
        {isStuck(transaction) ? <StuckChip /> : null}
        <ChannelBadge channel={transaction.channel} />
        {transaction.channel === 'manual' ? <ManualChip /> : null}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
        <span className="text-foreground">{transaction.studentName}</span>
        {transaction.receiptNumber ? (
          <>
            <span aria-hidden>·</span>
            <span className="font-mono text-xs">
              {t('payments.detail.receiptNumber')}: {transaction.receiptNumber}
            </span>
          </>
        ) : null}
      </div>
    </div>
  );
}
