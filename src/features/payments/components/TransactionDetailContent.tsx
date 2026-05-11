// Content sections for the Transaction Detail full page (Pattern A).
// Rendered by /payments/transactions/:id.
import { useState } from 'react';
import { Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { AmountDisplay } from '@/components/shared/AmountDisplay';
import { ChannelBadge } from '@/components/shared/ChannelBadge';
import { ManualChip } from './ManualChip';
import { TransactionIdCopy } from './TransactionIdCopy';
import { TransactionTimeline } from './TransactionTimeline';
import { deriveUpcomingTypes } from './timeline';
import { ReceiptPreviewDialog } from './ReceiptPreviewDialog';
import { ErrorCell } from './ErrorCell';
import type { Transaction } from '@/types/domain';

interface Props {
  transaction: Transaction;
}

export function TransactionDetailContent({ transaction }: Props) {
  const { t } = useTranslation();
  const [receiptOpen, setReceiptOpen] = useState(false);
  const events = transaction.events ?? [
    { type: 'created' as const, at: transaction.createdAt, actor: 'user' as const },
  ];
  const upcoming = deriveUpcomingTypes(transaction.status, events);
  const showReceipt = transaction.status === 'paid' || transaction.status === 'refunded';

  return (
    <div className="flex flex-col gap-6">
      {/* Student */}
      <Section heading={t('payments.detail.studentHeading')}>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Row
            label={t('payments.list.columns.student')}
            value={<span className="font-medium">{transaction.studentName}</span>}
          />
          <Row
            label={t('payments.detail.transactionId')}
            value={<TransactionIdCopy value={transaction.id} />}
          />
          {transaction.receiptNumber ? (
            <Row
              label={t('payments.detail.receiptNumber')}
              value={
                <span className="font-mono text-xs text-foreground">
                  {transaction.receiptNumber}
                </span>
              }
            />
          ) : null}
        </dl>
      </Section>

      {/* Payment breakdown */}
      <Section heading={t('payments.detail.breakdownHeading')}>
        <dl className="space-y-2">
          <BreakdownRow
            label={t('payments.detail.amountLabel')}
            value={<AmountDisplay value={transaction.amount} className="font-semibold" />}
          />
          <BreakdownRow
            label={t('payments.detail.commissionLabel')}
            value={<AmountDisplay value={transaction.commission} muted />}
          />
          <div className="mt-3 flex items-baseline justify-between border-t border-border pt-3">
            <span className="text-sm font-medium text-muted-foreground">
              {t('payments.detail.netLabel')}
            </span>
            <span className="text-base font-mono font-semibold tabular text-foreground">
              <AmountDisplay value={transaction.net} />
            </span>
          </div>
        </dl>
      </Section>

      {/* Channel + reference */}
      <Section heading={t('payments.detail.channelHeading')}>
        <div className="flex flex-wrap items-center gap-2">
          <ChannelBadge channel={transaction.channel} />
          {transaction.channel === 'manual' ? <ManualChip /> : null}
          {transaction.paymentMethod ? (
            <span className="text-sm text-muted-foreground">
              · {t(`payments.detail.paymentMethod.${transaction.paymentMethod}`)}
            </span>
          ) : null}
        </div>
        {transaction.note ? (
          <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {t('payments.detail.manualEntryNote')}:{' '}
            </span>
            {transaction.note}
          </p>
        ) : null}
        {transaction.status === 'failed' ? (
          <div className="mt-3">
            <ErrorCell code={transaction.failureCode} />
          </div>
        ) : null}
      </Section>

      {/* Timeline (horizontal) */}
      <Section heading={t('payments.detail.timelineHeading')}>
        <TransactionTimeline events={events} upcomingTypes={upcoming} />
      </Section>

      {/* Receipt — opens in modal on press */}
      {showReceipt ? (
        <Section heading={t('payments.detail.receiptHeading')}>
          <Button type="button" variant="outline" onClick={() => setReceiptOpen(true)}>
            <Eye className="mr-1.5 size-4" aria-hidden />
            {t('payments.detail.previewReceipt')}
          </Button>
          <ReceiptPreviewDialog
            open={receiptOpen}
            onOpenChange={setReceiptOpen}
            transaction={transaction}
          />
        </Section>
      ) : null}
    </div>
  );
}

function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground">{heading}</h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm text-foreground">{value}</dd>
    </div>
  );
}

function BreakdownRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-mono tabular text-foreground">{value}</span>
    </div>
  );
}
