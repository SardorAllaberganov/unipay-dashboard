// Payouts list table — DataTable<PayoutJson>. Per the column-meta lesson:
// amount columns get `text-right whitespace-nowrap` on BOTH header AND cell;
// narrow columns (period, status, bank account, bank ref, actions) get
// `w-[1%] whitespace-nowrap` on the header (and on the cell where the value
// itself can have spaces). Mono PayoutId column uses `text-xs font-mono`
// (allowed §0.2 mono-id allow-list).
import { useMemo, type ReactNode } from 'react';
import { Download, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable, type DataTableState } from '@/components/shared/DataTable';
import { StatusBadge, type StatusBadgeVariant } from '@/components/shared/StatusBadge';
import { MaskedAccount } from '@/components/unipay/MaskedAccount';
import { formatDate, formatMoney, formatNumber } from '@/lib/format';
import { payoutsApi, type PayoutJson } from '../api';
import { PayoutIdCopy } from './PayoutIdCopy';
import type { BankAccount, PayoutStatus } from '@/types/domain';

const STATUS_TO_VARIANT: Record<PayoutStatus, StatusBadgeVariant> = {
  settled: 'paid',
  pending: 'pending',
  failed: 'failed',
};

interface Props {
  state: DataTableState;
  data: PayoutJson[];
  bankAccountsById?: Map<string, BankAccount>;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onRetry?: () => void;
  partial?: { shown: number; total: number };
}

export function PayoutsTable({
  state,
  data,
  bankAccountsById,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  onRetry,
  partial,
}: Props) {
  const { t } = useTranslation();

  const columns = useMemo<ColumnDef<PayoutJson, unknown>[]>(() => {
    return [
      {
        id: 'id',
        header: () => <>{t('payouts.list.columns.id')}</>,
        cell: ({ row }) => <PayoutIdCopy value={row.original.id} />,
        meta: {
          headerClassName: 'w-[1%] whitespace-nowrap',
          cellClassName: 'whitespace-nowrap',
        },
      },
      {
        id: 'period',
        header: () => <>{t('payouts.list.columns.period')}</>,
        cell: ({ row }) => (
          <span className="text-sm tabular whitespace-nowrap text-foreground">
            {formatDate(row.original.periodFrom)} – {formatDate(row.original.periodTo)}
          </span>
        ),
        meta: {
          headerClassName: 'w-[1%] whitespace-nowrap',
          cellClassName: 'whitespace-nowrap',
        },
      },
      {
        id: 'transactionsCount',
        header: () => <>{t('payouts.list.columns.transactionsCount')}</>,
        cell: ({ row }) => (
          <span className="text-sm tabular">
            {formatNumber(row.original.transactionsCount)}
          </span>
        ),
        meta: {
          headerClassName: 'text-right whitespace-nowrap',
          cellClassName: 'text-right whitespace-nowrap',
        },
      },
      {
        id: 'gross',
        header: () => <>{t('payouts.list.columns.gross')}</>,
        cell: ({ row }) => (
          <span className="text-sm tabular font-mono whitespace-nowrap">
            {formatMoney(row.original.gross)}
          </span>
        ),
        meta: {
          headerClassName: 'text-right whitespace-nowrap',
          cellClassName: 'text-right whitespace-nowrap',
        },
      },
      {
        id: 'commission',
        header: () => <>{t('payouts.list.columns.commission')}</>,
        cell: ({ row }) => (
          <span className="text-sm tabular font-mono whitespace-nowrap text-muted-foreground">
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
        header: () => <>{t('payouts.list.columns.net')}</>,
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
        id: 'bankAccount',
        header: () => <>{t('payouts.list.columns.bankAccount')}</>,
        cell: ({ row }) => {
          const ba = bankAccountsById?.get(row.original.bankAccountId);
          if (!ba) {
            return <span className="text-sm text-muted-foreground">—</span>;
          }
          return (
            <span className="flex items-center gap-1.5 text-sm text-foreground whitespace-nowrap">
              <span className="truncate">{ba.bankName}</span>
              <MaskedAccount value={ba.accountNumber} className="text-xs" />
            </span>
          );
        },
        meta: {
          headerClassName: 'w-[1%] whitespace-nowrap',
          cellClassName: 'whitespace-nowrap',
        },
      },
      {
        id: 'bankRef',
        header: () => <>{t('payouts.list.columns.bankRef')}</>,
        cell: ({ row }) => {
          const ref: ReactNode = row.original.bankRef ?? '—';
          return (
            <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
              {ref}
            </span>
          );
        },
        meta: {
          headerClassName: 'w-[1%] whitespace-nowrap',
          cellClassName: 'whitespace-nowrap',
        },
      },
      {
        id: 'status',
        header: () => <>{t('payouts.list.columns.status')}</>,
        cell: ({ row }) => (
          <StatusBadge variant={STATUS_TO_VARIANT[row.original.status]} />
        ),
        meta: {
          headerClassName: 'w-[1%] whitespace-nowrap',
          cellClassName: 'whitespace-nowrap',
        },
      },
      {
        id: 'completedAt',
        header: () => <>{t('payouts.list.columns.completedAt')}</>,
        cell: ({ row }) => (
          <span className="text-sm tabular text-foreground whitespace-nowrap">
            {row.original.completedAt ? formatDate(row.original.completedAt) : '—'}
          </span>
        ),
        meta: {
          headerClassName: 'w-[1%] whitespace-nowrap',
          cellClassName: 'whitespace-nowrap',
        },
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">{t('payouts.list.columns.actions')}</span>,
        cell: ({ row }) => (
          <a
            href={payoutsApi.statementUrl(row.original.id)}
            target="_blank"
            rel="noopener"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={t('payouts.list.actions.downloadStatement')}
          >
            <Download className="size-4" aria-hidden />
          </a>
        ),
        meta: {
          headerClassName: 'w-[1%] whitespace-nowrap',
          cellClassName: 'whitespace-nowrap pr-3',
        },
      },
    ];
  }, [t, bankAccountsById]);

  return (
    <DataTable<PayoutJson>
      columns={columns}
      data={data}
      state={state}
      onRetry={onRetry}
      partial={partial}
      emptyTitle={t('payouts.list.empty.title')}
      emptyDescription={t('payouts.list.empty.body')}
      pagination={{
        page,
        pageSize,
        total,
        onPageChange,
        onPageSizeChange,
        pageSizeOptions: [25, 50, 100],
      }}
      rowKey={(p) => p.id}
      rowHref={(p) => `/payouts/${p.id}`}
      getRowAriaLabel={(p) => t('payouts.list.rowAria', { id: p.id })}
      mobileCardRender={(p) => (
        <PayoutMobileCard payout={p} bankAccount={bankAccountsById?.get(p.bankAccountId)} />
      )}
    />
  );
}

function PayoutMobileCard({
  payout,
  bankAccount,
}: {
  payout: PayoutJson;
  bankAccount?: BankAccount;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <PayoutIdCopy value={payout.id} />
        <StatusBadge variant={STATUS_TO_VARIANT[payout.status]} />
      </div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm tabular text-muted-foreground whitespace-nowrap">
          {formatDate(payout.periodFrom)} – {formatDate(payout.periodTo)}
        </span>
        <span className="text-base font-semibold tabular font-mono whitespace-nowrap">
          {formatMoney(payout.net)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <span className="truncate">
          {bankAccount ? `${bankAccount.bankName} ` : ''}
          {bankAccount ? <MaskedAccount value={bankAccount.accountNumber} className="text-xs" /> : null}
        </span>
        <a
          href={payoutsApi.statementUrl(payout.id)}
          target="_blank"
          rel="noopener"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-sm text-brand-700 hover:underline"
        >
          {t('payouts.list.actions.downloadStatement')}
          <ExternalLink className="size-3" aria-hidden />
        </a>
      </div>
    </div>
  );
}

