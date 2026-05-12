// Refunds table. Two modes: 'pending' (approve/reject actions) and 'history' (read-only).
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/DataTable';
import { AmountDisplay } from '@/components/shared/AmountDisplay';
import { DateDisplay } from '@/components/shared/DateDisplay';
import { StatusBadge, type StatusBadgeVariant } from '@/components/shared/StatusBadge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { WriteButton } from '@/components/unipay/WriteButton';
import { TransactionIdCopy } from './TransactionIdCopy';
import { useApproveRefund, useRejectRefund } from '../hooks/usePaymentsMutations';
import type { Refund, RefundStatus } from '@/types/domain';

const REFUND_STATUS_TO_VARIANT: Record<RefundStatus, StatusBadgeVariant> = {
  pending: 'pending',
  approved: 'paid',
  rejected: 'failed',
  completed: 'refunded',
};

interface Props {
  mode: 'pending' | 'history';
  data: Refund[];
  state: 'loading' | 'empty' | 'error' | 'offline' | 'partial' | 'data';
  onRetry: () => void;
}

export function RefundsTable({ mode, data, state, onRetry }: Props) {
  const { t } = useTranslation();
  const [approveTarget, setApproveTarget] = useState<Refund | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Refund | null>(null);
  const approve = useApproveRefund();
  const reject = useRejectRefund();

  const baseColumns: ColumnDef<Refund, unknown>[] = [
    {
      id: 'date',
      header: () => t('payments.refunds.columns.date'),
      meta: { headerClassName: 'w-[1%]', cellClassName: 'whitespace-nowrap' },
      cell: ({ row }) => <DateDisplay value={row.original.requestedAt} format="datetime" />,
    },
    {
      id: 'student',
      header: () => t('payments.refunds.columns.student'),
      cell: ({ row }) => (
        <span className="text-sm font-medium text-foreground">{row.original.studentName}</span>
      ),
    },
    {
      id: 'originalTx',
      header: () => t('payments.refunds.columns.originalTx'),
      meta: { headerClassName: 'w-[1%] whitespace-nowrap', cellClassName: 'whitespace-nowrap' },
      cell: ({ row }) => (
        <Link
          to={`/payments/transactions/${encodeURIComponent(row.original.transactionId)}`}
          className="text-sm hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          <TransactionIdCopy value={row.original.transactionId} />
        </Link>
      ),
    },
    {
      id: 'amount',
      header: () => t('payments.refunds.columns.amount'),
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
      id: 'reason',
      header: () => t('payments.refunds.columns.reason'),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {t(`payments.refunds.reasons.${row.original.reason}`)}
        </span>
      ),
    },
    {
      id: 'status',
      header: () => t('payments.refunds.columns.status'),
      meta: { headerClassName: 'w-[1%]', cellClassName: 'whitespace-nowrap' },
      cell: ({ row }) => (
        <StatusBadge
          variant={REFUND_STATUS_TO_VARIANT[row.original.status]}
          label={t(`payments.refunds.statuses.${row.original.status}`)}
        />
      ),
    },
  ];

  const historyExtra: ColumnDef<Refund, unknown>[] = [
    {
      id: 'refundTx',
      header: () => t('payments.refunds.columns.refundTx'),
      meta: { headerClassName: 'w-[1%] whitespace-nowrap', cellClassName: 'whitespace-nowrap' },
      cell: ({ row }) =>
        row.original.refundTransactionId ? (
          <TransactionIdCopy value={row.original.refundTransactionId} />
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: 'bankRef',
      header: () => t('payments.refunds.columns.bankRef'),
      meta: { headerClassName: 'w-[1%] whitespace-nowrap', cellClassName: 'whitespace-nowrap' },
      cell: ({ row }) =>
        row.original.bankRef ? (
          <span className="font-mono text-xs text-foreground">{row.original.bankRef}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
  ];

  const pendingActions: ColumnDef<Refund, unknown>[] = [
    {
      id: 'actions',
      header: () => <span className="sr-only">{t('payments.refunds.columns.actions')}</span>,
      meta: { headerClassName: 'w-[1%]', cellClassName: 'pr-3 whitespace-nowrap' },
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <WriteButton
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setApproveTarget(row.original);
            }}
          >
            {t('payments.refunds.approve.cta')}
          </WriteButton>
          <WriteButton
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setRejectTarget(row.original);
            }}
          >
            {t('payments.refunds.reject.cta')}
          </WriteButton>
        </div>
      ),
    },
  ];

  const columns = mode === 'pending'
    ? [...baseColumns, ...pendingActions]
    : [...baseColumns, ...historyExtra];

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        state={state}
        onRetry={onRetry}
        rowKey={(r) => r.id}
        emptyTitle={
          mode === 'pending'
            ? t('payments.refunds.emptyPendingTitle')
            : t('payments.refunds.emptyHistoryTitle')
        }
        emptyDescription={
          mode === 'pending'
            ? t('payments.refunds.emptyPendingBody')
            : t('payments.refunds.emptyHistoryBody')
        }
        mobileCardRender={(refund) => (
          // No outer wrapper — DataTable's mobile path already wraps each row in <Card p-4>.
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-1">
                <span className="block text-sm font-medium text-foreground">
                  {refund.studentName}
                </span>
                <span className="block text-sm text-muted-foreground">
                  {t(`payments.refunds.reasons.${refund.reason}`)}
                </span>
              </div>
              <span className="font-mono font-semibold tabular text-foreground">
                <AmountDisplay value={refund.amount} />
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <StatusBadge
                variant={REFUND_STATUS_TO_VARIANT[refund.status]}
                label={t(`payments.refunds.statuses.${refund.status}`)}
              />
              <DateDisplay
                value={refund.requestedAt}
                format="datetime"
                className="text-sm text-muted-foreground"
              />
            </div>
            {mode === 'pending' ? (
              <div className="mt-3 flex gap-2">
                <WriteButton
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setApproveTarget(refund)}
                >
                  {t('payments.refunds.approve.cta')}
                </WriteButton>
                <WriteButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={() => setRejectTarget(refund)}
                >
                  {t('payments.refunds.reject.cta')}
                </WriteButton>
              </div>
            ) : null}
          </div>
        )}
      />

      <ConfirmDialog
        open={!!approveTarget}
        onOpenChange={(o) => !o && setApproveTarget(null)}
        title={t('payments.refunds.approve.title')}
        description={t('payments.refunds.approve.body', {
          // MSW collapses Money.amount bigint -> number — convert to Number first.
          amount: approveTarget
            ? new Intl.NumberFormat('ru-RU').format(
                Number(approveTarget.amount.amount) / 100,
              ) + ' UZS'
            : '',
        })}
        confirmLabel={t('payments.refunds.approve.confirm')}
        onConfirm={async () => {
          if (!approveTarget) return;
          await approve.mutateAsync(approveTarget.id);
          setApproveTarget(null);
        }}
      />
      <ConfirmDialog
        open={!!rejectTarget}
        onOpenChange={(o) => !o && setRejectTarget(null)}
        title={t('payments.refunds.reject.title')}
        description={t('payments.refunds.reject.body')}
        confirmLabel={t('payments.refunds.reject.confirm')}
        destructive
        requireReason
        minReasonLength={20}
        reasonPlaceholder={t('payments.refunds.reject.reasonHint')}
        onConfirm={async (reason) => {
          if (!rejectTarget) return;
          await reject.mutateAsync({ id: rejectTarget.id, reason: reason ?? '' });
          setRejectTarget(null);
        }}
      />
    </>
  );
}
