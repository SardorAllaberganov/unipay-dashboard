// Transactions DataTable. 9 columns per spec §9.1 (kebab column removed — row click navigates
// to the detail page where View / Refund / Download live).
// `meta.headerClassName: 'w-[1%]'` on icon-only cells per LESSONS 2026-05-11. Table headers
// flow inline with content per §0.6. Density inherited from `html[data-density]` via the
// global `--row-h` CSS var (§0.7b).
//
// Row click navigates directly to /payments/transactions/:id. The DataTable's `rowHref`
// mechanism supports Cmd/Ctrl/Shift-click + middle-click for new-tab semantics.
import { useTranslation } from 'react-i18next';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/DataTable';
import { AmountDisplay } from '@/components/shared/AmountDisplay';
import { ChannelBadge } from '@/components/shared/ChannelBadge';
import { DateDisplay } from '@/components/shared/DateDisplay';
import { StatusBadge, type StatusBadgeVariant } from '@/components/shared/StatusBadge';
import { TransactionIdCopy } from './TransactionIdCopy';
import { ErrorCell } from './ErrorCell';
import { StuckChip } from './StuckChip';
import { ManualChip } from './ManualChip';
import { TransactionMobileCard } from './TransactionMobileCard';
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

function detailHref(tx: Transaction): string {
  return `/payments/transactions/${encodeURIComponent(tx.id)}`;
}

interface Props {
  data: Transaction[];
  state: 'loading' | 'empty' | 'error' | 'offline' | 'partial' | 'data';
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  onRetry: () => void;
  /** When true, DataTable drops its inner shell so a parent surface owns the border. */
  bare?: boolean;
}

export function TransactionsTable({
  data,
  state,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions,
  onRetry,
  bare,
}: Props) {
  const { t } = useTranslation();

  const columns: ColumnDef<Transaction, unknown>[] = [
    {
      id: 'id',
      header: () => t('payments.list.columns.id'),
      meta: { headerClassName: 'w-[1%] whitespace-nowrap', cellClassName: 'whitespace-nowrap' },
      cell: ({ row }) => <TransactionIdCopy value={row.original.id} />,
    },
    {
      id: 'student',
      header: () => t('payments.list.columns.student'),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">
            {row.original.studentName}
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.studentId}
          </span>
        </div>
      ),
    },
    {
      id: 'department',
      header: () => t('payments.list.columns.department'),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.departmentId}
        </span>
      ),
    },
    {
      id: 'amount',
      header: () => t('payments.list.columns.amount'),
      meta: {
        headerClassName: 'text-right',
        cellClassName: 'text-right whitespace-nowrap',
      },
      cell: ({ row }) => (
        <span className="font-mono font-medium tabular text-foreground">
          <AmountDisplay value={row.original.amount} />
        </span>
      ),
    },
    {
      id: 'commission',
      header: () => t('payments.list.columns.commission'),
      meta: {
        headerClassName: 'text-right',
        cellClassName: 'text-right whitespace-nowrap',
      },
      cell: ({ row }) => <AmountDisplay value={row.original.commission} muted />,
    },
    {
      id: 'net',
      header: () => t('payments.list.columns.net'),
      meta: {
        headerClassName: 'text-right',
        cellClassName: 'text-right whitespace-nowrap',
      },
      cell: ({ row }) => (
        <span className="font-mono font-medium tabular text-foreground">
          <AmountDisplay value={row.original.net} />
        </span>
      ),
    },
    {
      id: 'channel',
      header: () => t('payments.list.columns.channel'),
      meta: { headerClassName: 'w-[1%]', cellClassName: 'whitespace-nowrap' },
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <ChannelBadge channel={row.original.channel} />
          {row.original.channel === 'manual' ? <ManualChip /> : null}
        </div>
      ),
    },
    {
      id: 'status',
      header: () => t('payments.list.columns.status'),
      meta: { headerClassName: 'w-[1%]', cellClassName: 'whitespace-nowrap' },
      cell: ({ row }) => {
        const tx = row.original;
        if (tx.status === 'failed') {
          return <ErrorCell code={tx.failureCode} />;
        }
        return (
          <div className="flex items-center gap-1.5">
            <StatusBadge variant={STATUS_TO_VARIANT[tx.status]} />
            {isStuck(tx) ? <StuckChip /> : null}
          </div>
        );
      },
    },
    {
      id: 'datetime',
      header: () => t('payments.list.columns.datetime'),
      meta: { headerClassName: 'w-[1%]', cellClassName: 'whitespace-nowrap' },
      cell: ({ row }) => (
        <DateDisplay value={row.original.createdAt} format="datetime" />
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      bare={bare}
      state={state}
      pagination={{ page, pageSize, total, onPageChange, onPageSizeChange, pageSizeOptions }}
      onRetry={onRetry}
      rowHref={detailHref}
      getRowAriaLabel={(tx) => `${t('payments.list.actions.view')}: ${tx.id}`}
      rowKey={(r) => r.id}
      emptyTitle={t('payments.list.emptyTitle')}
      emptyDescription={t('payments.list.emptyBody')}
      mobileCardRender={(tx) => (
        <TransactionMobileCard tx={tx} isStuck={isStuck(tx)} />
      )}
    />
  );
}
