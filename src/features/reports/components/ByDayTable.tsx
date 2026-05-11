import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ColumnDef } from '@tanstack/react-table';
import { Landmark } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DataTable, type DataTableState } from '@/components/shared/DataTable';
import { formatDate, formatNumber, formatUZS } from '@/lib/format';
import { useNetworkState } from '@/hooks/useNetworkState';
import { useByDay } from '../hooks/useByDay';
import type { ByDayRow, ReportDateRange } from '../api';

interface Props {
  range?: ReportDateRange;
}

// `Money.amount` arrives as a JS number on the wire (MSW BigInt → toJSON patch).
// `formatUZS` expects UZS major units, so divide by 100 at display time.
const tiyinsToUzs = (n: number) => Math.round(n / 100);

export function ByDayTable({ range }: Props) {
  const { t } = useTranslation();
  const online = useNetworkState();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const query = useByDay(range);

  // Stable reference so useMemo deps don't churn between query refetches.
  const items = useMemo(() => query.data?.items ?? [], [query.data]);
  const total = items.length;
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, lastPage);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  const columns = useMemo<ColumnDef<ByDayRow, unknown>[]>(() => {
    return [
      {
        id: 'date',
        accessorKey: 'date',
        header: t('reports.byDay.columns.date'),
        cell: ({ row }) => (
          <span className="tabular whitespace-nowrap">{formatDate(row.original.date)}</span>
        ),
        enableSorting: true,
        // Narrow column collapses to content per the column-meta lesson.
        // Both header AND cell carry `whitespace-nowrap` so the localized header doesn't wrap to two lines.
        meta: {
          headerClassName: 'w-[1%] whitespace-nowrap',
          cellClassName: 'whitespace-nowrap',
        },
      },
      {
        id: 'transactions',
        accessorKey: 'transactions',
        header: t('reports.byDay.columns.transactions'),
        cell: ({ row }) => (
          <span className="tabular whitespace-nowrap">
            {formatNumber(row.original.transactions)}
          </span>
        ),
        enableSorting: true,
        // Mirror text-right on both sides; whitespace-nowrap stays — formatted thousands have spaces in `ru-RU`.
        meta: {
          headerClassName: 'text-right whitespace-nowrap',
          cellClassName: 'text-right whitespace-nowrap',
        },
      },
      {
        id: 'totalCharged',
        accessorFn: (row) => row.totalCharged.amount,
        header: t('reports.byDay.columns.totalCharged'),
        cell: ({ row }) => (
          <span className="tabular whitespace-nowrap font-medium">
            {formatUZS(tiyinsToUzs(row.original.totalCharged.amount))}
          </span>
        ),
        enableSorting: true,
        meta: {
          headerClassName: 'text-right whitespace-nowrap',
          cellClassName: 'text-right whitespace-nowrap',
        },
      },
      {
        id: 'commission',
        accessorFn: (row) => row.commission.amount,
        header: t('reports.byDay.columns.commission'),
        cell: ({ row }) => (
          <span className="tabular whitespace-nowrap text-muted-foreground">
            {formatUZS(tiyinsToUzs(row.original.commission.amount))}
          </span>
        ),
        enableSorting: true,
        meta: {
          headerClassName: 'text-right whitespace-nowrap',
          cellClassName: 'text-right whitespace-nowrap',
        },
      },
      {
        id: 'net',
        accessorFn: (row) => row.net.amount,
        header: t('reports.byDay.columns.net'),
        cell: ({ row }) => (
          <span className="tabular whitespace-nowrap font-medium">
            {formatUZS(tiyinsToUzs(row.original.net.amount))}
          </span>
        ),
        enableSorting: true,
        meta: {
          headerClassName: 'text-right whitespace-nowrap',
          cellClassName: 'text-right whitespace-nowrap',
        },
      },
      {
        id: 'payout',
        accessorKey: 'payoutId',
        header: t('reports.byDay.columns.payout'),
        cell: ({ row }) =>
          row.original.payoutId ? (
            <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-md bg-success-50 px-2 py-0.5 text-xs font-medium text-success-700 dark:bg-success-700/10 dark:text-success-400">
              <Landmark className="size-3.5" aria-hidden />
              {t('reports.byDay.payoutBadge')}
            </span>
          ) : (
            <span className="text-muted-foreground">{t('reports.byDay.noPayout')}</span>
          ),
        enableSorting: false,
        meta: {
          headerClassName: 'w-[1%] whitespace-nowrap',
          cellClassName: 'whitespace-nowrap pr-3',
        },
      },
    ];
  }, [t]);

  const state: DataTableState = (() => {
    if (query.isPending) return 'loading';
    if (query.isError) return online ? 'error' : 'offline';
    if (total === 0) return 'empty';
    if (query.data?._meta?.partial) return 'partial';
    return 'data';
  })();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('reports.byDay.title')}</CardTitle>
        <CardDescription>{t('reports.byDay.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable<ByDayRow>
          columns={columns}
          data={pageItems}
          state={state}
          onRetry={() => query.refetch()}
          emptyTitle={t('reports.byDay.emptyTitle')}
          emptyDescription={t('reports.byDay.emptyBody')}
          partial={
            query.data?._meta?.partial
              ? {
                  shown: query.data._meta.shown ?? pageItems.length,
                  total: query.data._meta.total ?? total,
                }
              : undefined
          }
          pagination={{
            page: safePage,
            pageSize,
            total,
            onPageChange: setPage,
            onPageSizeChange: (next) => {
              setPageSize(next);
              setPage(1);
            },
            pageSizeOptions: [30, 60, 90],
          }}
          rowKey={(row) => row.date}
          mobileCardRender={(row) => (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <span className="tabular font-medium">{formatDate(row.date)}</span>
                {row.payoutId ? (
                  <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-md bg-success-50 px-2 py-0.5 text-xs font-medium text-success-700">
                    <Landmark className="size-3.5" aria-hidden />
                    {t('reports.byDay.payoutBadge')}
                  </span>
                ) : null}
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                <span className="text-muted-foreground">
                  {t('reports.byDay.columns.transactions')}
                </span>
                <span className="text-right tabular">{formatNumber(row.transactions)}</span>
                <span className="text-muted-foreground">
                  {t('reports.byDay.columns.totalCharged')}
                </span>
                <span className="text-right tabular font-medium">
                  {formatUZS(tiyinsToUzs(row.totalCharged.amount))}
                </span>
                <span className="text-muted-foreground">
                  {t('reports.byDay.columns.commission')}
                </span>
                <span className="text-right tabular text-muted-foreground">
                  {formatUZS(tiyinsToUzs(row.commission.amount))}
                </span>
                <span className="text-muted-foreground">{t('reports.byDay.columns.net')}</span>
                <span className="text-right tabular font-medium">
                  {formatUZS(tiyinsToUzs(row.net.amount))}
                </span>
              </div>
            </div>
          )}
        />
      </CardContent>
    </Card>
  );
}
