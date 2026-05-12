// Mobile card render for a transaction row. The DataTable's mobile path already wraps each row
// in a `<Card>` — this component must return a plain `<div>` to avoid nesting two cards.
import { AmountDisplay } from '@/components/shared/AmountDisplay';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ChannelBadge } from '@/components/shared/ChannelBadge';
import { DateDisplay } from '@/components/shared/DateDisplay';
import type { Transaction } from '@/types/domain';
import type { StatusBadgeVariant } from '@/components/shared/StatusBadge';
import { TransactionIdCopy } from './TransactionIdCopy';
import { ErrorCell } from './ErrorCell';
import { StuckChip } from './StuckChip';
import { ManualChip } from './ManualChip';

const STATUS_TO_VARIANT: Record<Transaction['status'], StatusBadgeVariant> = {
  paid: 'paid',
  processing: 'processing',
  pending: 'pending',
  overdue: 'overdue',
  failed: 'failed',
  refunded: 'refunded',
};

interface Props {
  tx: Transaction;
  isStuck: boolean;
}

export function TransactionMobileCard({ tx, isStuck }: Props) {
  // No outer wrapper element — the DataTable already wraps in <Card> with click/keyboard
  // handlers (driven by rowHref). We just supply the content.
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-base font-semibold tabular text-foreground">
          <AmountDisplay value={tx.amount} />
        </span>
        <DateDisplay value={tx.createdAt} format="datetime" className="text-sm text-muted-foreground" />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <StatusBadge variant={STATUS_TO_VARIANT[tx.status]} />
        {isStuck ? <StuckChip /> : null}
        <ChannelBadge channel={tx.channel} />
        {tx.channel === 'manual' ? <ManualChip /> : null}
      </div>
      {tx.status === 'failed' ? (
        <div className="mt-2">
          <ErrorCell code={tx.failureCode} />
        </div>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-foreground">{tx.studentName}</span>
        <TransactionIdCopy value={tx.id} />
      </div>
    </div>
  );
}
