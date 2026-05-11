import { useTranslation } from 'react-i18next';
import { ExternalLink } from 'lucide-react';
import { ResponsiveSheet } from '@/components/shared/ResponsiveSheet';
import { Button } from '@/components/ui/button';
import { AmountDisplay } from '@/components/shared/AmountDisplay';
import { DateDisplay } from '@/components/shared/DateDisplay';
import { ChannelBadge } from '@/components/shared/ChannelBadge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import type { Transaction } from '@/types/domain';

interface Props {
  transaction: Transaction | null;
  onOpenChange: (open: boolean) => void;
}

export function TransactionDetailSheet({ transaction, onOpenChange }: Props) {
  const { t } = useTranslation();
  const open = !!transaction;
  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('students.transactions.detail.title')}
    >
      {transaction ? (
        <dl className="divide-y divide-border text-sm">
          <Row label={t('students.transactions.detail.date')} value={<DateDisplay value={transaction.createdAt} format="datetime" />} />
          <Row label={t('students.transactions.detail.amount')} value={<AmountDisplay value={transaction.amount} />} />
          <Row label={t('students.transactions.detail.commission')} value={<AmountDisplay value={transaction.commission} />} />
          <Row label={t('students.transactions.detail.net')} value={<AmountDisplay value={transaction.net} />} />
          <Row label={t('students.transactions.detail.channel')} value={<ChannelBadge channel={transaction.channel} />} />
          <Row
            label={t('students.transactions.detail.status')}
            value={
              <StatusBadge
                variant={
                  transaction.status === 'paid'
                    ? 'paid'
                    : transaction.status === 'refunded'
                      ? 'refunded'
                      : transaction.status === 'failed'
                        ? 'failed'
                        : transaction.status === 'overdue'
                          ? 'overdue'
                          : 'pending'
                }
              />
            }
          />
          {transaction.receiptUrl ? (
            <div className="pt-3">
              <Button asChild variant="outline" type="button">
                <a href={transaction.receiptUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-1.5 size-4" aria-hidden />
                  {t('students.transactions.detail.receipt')}
                </a>
              </Button>
            </div>
          ) : null}
        </dl>
      ) : null}
    </ResponsiveSheet>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2 first:pt-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right text-foreground">{value}</dd>
    </div>
  );
}
