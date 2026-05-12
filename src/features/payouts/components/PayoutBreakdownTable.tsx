// Per-transaction breakdown DataTable on /payouts/:id. Paginated 50/page,
// all 6 states via DataTable. Column meta follows the 2026-05-11 lesson —
// amount columns mirror right-align + nowrap on both header and cell.
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable, type DataTableState } from '@/components/shared/DataTable';
import { ChannelBadge } from '@/components/shared/ChannelBadge';
import { StatusBadge, type StatusBadgeVariant } from '@/components/shared/StatusBadge';
import { formatDateTime, formatMoney } from '@/lib/format';
import type { PayoutBreakdownRowJson } from '../api';
import type { PaymentStatus } from '@/types/domain';
import { PayoutIdCopy } from './PayoutIdCopy';

const STATUS_TO_VARIANT: Record<PaymentStatus, StatusBadgeVariant> = {
  paid: 'paid',
  processing: 'processing',
  pending: 'pending',
  overdue: 'overdue',
  failed: 'failed',
  refunded: 'refunded',
};

interface Props {
  state: DataTableState;
  data: PayoutBreakdownRowJson[];
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onRetry?: () => void;
  partial?: { shown: number; total: number };
}

export function PayoutBreakdownTable({
  state,
  data,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  onRetry,
  partial,
}: Props) {
  const { t } = useTranslation();

  const columns = useMemo<ColumnDef<PayoutBreakdownRowJson, unknown>[]>(() => {
    return [
      {
        id: 'transactionId',
        header: () => <>{t('payouts.breakdown.columns.transactionId')}</>,
        cell: ({ row }) => <PayoutIdCopy value={row.original.transactionId} />,
        meta: {
          headerClassName: 'w-[1%] whitespace-nowrap',
          cellClassName: 'whitespace-nowrap',
        },
      },
      {
        id: 'studentName',
        header: () => <>{t('payouts.breakdown.columns.student')}</>,
        cell: ({ row }) => (
          <span className="text-sm text-foreground truncate block max-w-[14rem]">
            {row.original.studentName}
          </span>
        ),
      },
      {
        id: 'channel',
        header: () => <>{t('payouts.breakdown.columns.channel')}</>,
        cell: ({ row }) => <ChannelBadge channel={row.original.channel} />,
        meta: {
          headerClassName: 'w-[1%] whitespace-nowrap',
          cellClassName: 'whitespace-nowrap',
        },
      },
      {
        id: 'status',
        header: () => <>{t('payouts.breakdown.columns.status')}</>,
        cell: ({ row }) => (
          <StatusBadge variant={STATUS_TO_VARIANT[row.original.status]} />
        ),
        meta: {
          headerClassName: 'w-[1%] whitespace-nowrap',
          cellClassName: 'whitespace-nowrap',
        },
      },
      {
        id: 'amount',
        header: () => <>{t('payouts.breakdown.columns.amount')}</>,
        cell: ({ row }) => (
          <span className="text-sm tabular font-mono whitespace-nowrap">
            {formatMoney(row.original.amount)}
          </span>
        ),
        meta: {
          headerClassName: 'text-right whitespace-nowrap',
          cellClassName: 'text-right whitespace-nowrap',
        },
      },
      {
        id: 'commission',
        header: () => <>{t('payouts.breakdown.columns.commission')}</>,
        cell: ({ row }) => (
          <span className="text-sm tabular font-mono text-muted-foreground whitespace-nowrap">
            {formatMoney(row.original.commission)}
          </span>
        ),
        meta: {
          headerClassName: 'text-right whitespace-nowrap',
          cellClassName: 'text-right whitespace-nowrap',
        },
      },
      {
        id: 'net',
        header: () => <>{t('payouts.breakdown.columns.net')}</>,
        cell: ({ row }) => (
          <span className="text-sm tabular font-mono font-semibold whitespace-nowrap">
            {formatMoney(row.original.net)}
          </span>
        ),
        meta: {
          headerClassName: 'text-right whitespace-nowrap',
          cellClassName: 'text-right whitespace-nowrap',
        },
      },
      {
        id: 'createdAt',
        header: () => <>{t('payouts.breakdown.columns.createdAt')}</>,
        cell: ({ row }) => (
          <span className="text-sm tabular text-foreground whitespace-nowrap">
            {formatDateTime(row.original.createdAt)}
          </span>
        ),
        meta: {
          headerClassName: 'w-[1%] whitespace-nowrap',
          cellClassName: 'whitespace-nowrap',
        },
      },
    ];
  }, [t]);

  return (
    <DataTable<PayoutBreakdownRowJson>
      columns={columns}
      data={data}
      state={state}
      onRetry={onRetry}
      partial={partial}
      emptyTitle={t('payouts.breakdown.empty.title')}
      emptyDescription={t('payouts.breakdown.empty.body')}
      pagination={{
        page,
        pageSize,
        total,
        onPageChange,
        onPageSizeChange,
        pageSizeOptions: [25, 50, 100],
      }}
      rowKey={(r) => r.transactionId}
      mobileCardRender={(r) => (
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <PayoutIdCopy value={r.transactionId} />
            <StatusBadge variant={STATUS_TO_VARIANT[r.status]} />
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm text-foreground truncate">{r.studentName}</span>
            <span className="text-base font-semibold tabular font-mono whitespace-nowrap">
              {formatMoney(r.net)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
            <ChannelBadge channel={r.channel} />
            <span className="tabular whitespace-nowrap">
              {formatDateTime(r.createdAt)}
            </span>
          </div>
        </div>
      )}
    />
  );
}
