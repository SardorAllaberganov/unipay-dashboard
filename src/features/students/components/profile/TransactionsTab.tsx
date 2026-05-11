import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ColumnDef } from '@tanstack/react-table';
import { ExternalLink } from 'lucide-react';
import { DataTable, type DataTableState } from '@/components/shared/DataTable';
import { AmountDisplay } from '@/components/shared/AmountDisplay';
import { DateDisplay } from '@/components/shared/DateDisplay';
import { ChannelBadge } from '@/components/shared/ChannelBadge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useNetworkState } from '@/hooks/useNetworkState';
import type { PaymentStatus, Transaction } from '@/types/domain';
import { useStudentTransactions } from '../../hooks/useStudentTransactions';
import { TransactionDetailSheet } from './TransactionDetailSheet';

interface Props {
  studentId: string;
}

function toTxStatusBadgeVariant(status: PaymentStatus) {
  if (status === 'paid') return 'paid' as const;
  if (status === 'refunded') return 'refunded' as const;
  if (status === 'failed') return 'failed' as const;
  if (status === 'overdue') return 'overdue' as const;
  if (status === 'processing') return 'processing' as const;
  return 'pending' as const;
}

export function TransactionsTab({ studentId }: Props) {
  const { t } = useTranslation();
  const online = useNetworkState();
  const query = useStudentTransactions(studentId);
  const items = query.data?.items ?? [];
  const meta = query.data?._meta;
  const [active, setActive] = useState<Transaction | null>(null);

  const state: DataTableState = useMemo(() => {
    if (query.isLoading) return 'loading';
    if (query.isError) return online ? 'error' : 'offline';
    if (!online && items.length === 0) return 'offline';
    if (meta?.partial) return 'partial';
    if (items.length === 0) return 'empty';
    return 'data';
  }, [query.isLoading, query.isError, online, items.length, meta?.partial]);

  const columns = useMemo<ColumnDef<Transaction, unknown>[]>(
    () => [
      {
        id: 'date',
        header: () => t('students.transactions.columns.date'),
        cell: ({ row }) => <DateDisplay value={row.original.createdAt} tooltip />,
      },
      {
        id: 'amount',
        meta: { cellClassName: 'text-right' },
        header: () => t('students.transactions.columns.amount'),
        cell: ({ row }) => <AmountDisplay value={row.original.amount} />,
      },
      {
        id: 'channel',
        meta: { headerClassName: 'w-[1%]' },
        header: () => t('students.transactions.columns.channel'),
        cell: ({ row }) => <ChannelBadge channel={row.original.channel} />,
      },
      {
        id: 'status',
        meta: { headerClassName: 'w-[1%]' },
        header: () => t('students.transactions.columns.status'),
        cell: ({ row }) => <StatusBadge variant={toTxStatusBadgeVariant(row.original.status)} />,
      },
      {
        id: 'receipt',
        meta: { headerClassName: 'w-[1%]', cellClassName: 'pr-3 text-right' },
        header: () => (
          <span className="sr-only">{t('students.transactions.columns.receipt')}</span>
        ),
        cell: ({ row }) =>
          row.original.receiptUrl ? (
            <a
              href={row.original.receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-sm text-brand-700 hover:underline"
              aria-label={t('students.transactions.receipt')}
            >
              <ExternalLink className="size-4" aria-hidden />
            </a>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          ),
      },
    ],
    [t],
  );

  return (
    <>
      <DataTable<Transaction>
        columns={columns}
        data={items}
        state={state}
        onRetry={() => void query.refetch()}
        emptyTitle={t('students.transactions.emptyTitle')}
        emptyDescription={t('students.transactions.emptyBody')}
        partial={
          meta?.partial && meta.shown !== undefined && meta.total !== undefined
            ? { shown: meta.shown, total: meta.total }
            : undefined
        }
        rowKey={(row) => row.id}
        onRowClick={(row) => setActive(row)}
        mobileCardRender={(row) => (
          <TransactionMobileCard transaction={row} />
        )}
      />
      <TransactionDetailSheet
        transaction={active}
        onOpenChange={(open) => {
          if (!open) setActive(null);
        }}
      />
    </>
  );
}

// ---- Mobile card render — transactions tab ----

function TransactionMobileCard({ transaction }: { transaction: Transaction }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <DateDisplay value={transaction.createdAt} className="text-sm text-muted-foreground" />
        <AmountDisplay
          value={transaction.amount}
          className="text-base font-semibold text-foreground"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <ChannelBadge channel={transaction.channel} />
        <StatusBadge variant={toTxStatusBadgeVariant(transaction.status)} />
        {transaction.receiptUrl ? (
          <a
            href={transaction.receiptUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="ml-auto inline-flex items-center gap-1 text-sm text-brand-700 hover:underline"
          >
            <ExternalLink className="size-4" aria-hidden />
          </a>
        ) : null}
      </div>
    </div>
  );
}
