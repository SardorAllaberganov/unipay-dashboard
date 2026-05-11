// /payments/transactions — main list. PageHeader + TransactionFilters + TransactionsTable
// + SummaryFooter. Row click navigates directly to /payments/transactions/:id.
import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Download, FileSpreadsheet, FileText, FileType } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { WriteButton } from '@/components/unipay/WriteButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-breakpoint';
import { useNetworkState } from '@/hooks/useNetworkState';
import { TransactionFilters, type TransactionFiltersValue } from '../components/TransactionFilters';
import { resolveFilters } from '../components/filters';
import { TransactionsTable } from '../components/TransactionsTable';
import { SummaryFooter } from '../components/SummaryFooter';
import { useTransactions } from '../hooks/useTransactions';
import { useBulkExport } from '../hooks/usePaymentsMutations';
import type { ExportFormat } from '../api';
import type { PaymentChannel, PaymentStatus } from '@/types/domain';
import type { DateRangeValue } from '@/components/shared/dateRange';

const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 50;

function readFilters(sp: URLSearchParams): TransactionFiltersValue {
  const range = (sp.get('range') ?? '30d') as DateRangeValue['range'];
  const customFromStr = sp.get('from');
  const customToStr = sp.get('to');
  const dateRange: DateRangeValue = { range };
  if (customFromStr) dateRange.customFrom = new Date(customFromStr);
  if (customToStr) dateRange.customTo = new Date(customToStr);
  return {
    search: sp.get('search') ?? '',
    dateRange,
    statuses: sp.getAll('status') as PaymentStatus[],
    channels: sp.getAll('channel') as PaymentChannel[],
  };
}

function writeFilters(v: TransactionFiltersValue): URLSearchParams {
  const sp = new URLSearchParams();
  if (v.search) sp.set('search', v.search);
  sp.set('range', v.dateRange.range);
  if (v.dateRange.range === 'custom' && v.dateRange.customFrom) {
    sp.set('from', v.dateRange.customFrom.toISOString());
  }
  if (v.dateRange.range === 'custom' && v.dateRange.customTo) {
    sp.set('to', v.dateRange.customTo.toISOString());
  }
  for (const s of v.statuses) sp.append('status', s);
  for (const c of v.channels) sp.append('channel', c);
  return sp;
}

export function TransactionsPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const online = useNetworkState();
  const isMobile = useIsMobile();
  const filters = useMemo(() => readFilters(searchParams), [searchParams]);
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const pageSizeParam = Number(searchParams.get('pageSize') ?? DEFAULT_PAGE_SIZE);
  const pageSize = (PAGE_SIZE_OPTIONS as readonly number[]).includes(pageSizeParam)
    ? pageSizeParam
    : DEFAULT_PAGE_SIZE;

  const { from, to } = resolveFilters(filters);
  const query = useTransactions({
    search: filters.search || undefined,
    statuses: filters.statuses.length ? filters.statuses : undefined,
    channels: filters.channels.length ? filters.channels : undefined,
    from,
    to,
    page,
    pageSize,
  });

  const exportMut = useBulkExport();

  function setFilters(next: TransactionFiltersValue) {
    const sp = writeFilters(next);
    setSearchParams(sp, { replace: true });
  }

  function setPage(next: number) {
    const sp = new URLSearchParams(searchParams);
    sp.set('page', String(next));
    setSearchParams(sp, { replace: true });
  }

  function setPageSize(next: number) {
    const sp = new URLSearchParams(searchParams);
    sp.set('pageSize', String(next));
    sp.set('page', '1');
    setSearchParams(sp, { replace: true });
  }

  // Reset page to 1 when filters change.
  useEffect(() => {
    const sp = new URLSearchParams(searchParams);
    if (Number(sp.get('page')) > 1) {
      sp.set('page', '1');
      setSearchParams(sp, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search, JSON.stringify(filters.statuses), JSON.stringify(filters.channels), filters.dateRange.range, filters.dateRange.customFrom, filters.dateRange.customTo]);

  const state: 'loading' | 'empty' | 'error' | 'offline' | 'partial' | 'data' = !online
    ? 'offline'
    : query.isLoading
      ? 'loading'
      : query.isError
        ? 'error'
        : (query.data?.items.length ?? 0) === 0
          ? 'empty'
          : 'data';

  return (
    <div>
      <PageHeader
        title={t('payments.list.title')}
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <WriteButton type="button" disabled={exportMut.isPending}>
                <Download className="mr-1.5 size-4" aria-hidden />
                {t('payments.list.exportCta')}
                <ChevronDown className="ml-1 size-4 opacity-80" aria-hidden />
              </WriteButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() =>
                  exportMut.mutate({ from, to, format: 'csv' satisfies ExportFormat })
                }
              >
                <FileText className="mr-2 size-4" aria-hidden />
                {t('payments.list.exportCsv')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  exportMut.mutate({ from, to, format: 'xlsx' satisfies ExportFormat })
                }
              >
                <FileSpreadsheet className="mr-2 size-4" aria-hidden />
                {t('payments.list.exportXlsx')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  exportMut.mutate({ from, to, format: 'pdf' satisfies ExportFormat })
                }
              >
                <FileType className="mr-2 size-4" aria-hidden />
                {t('payments.list.exportPdf')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      <TransactionFilters value={filters} onChange={setFilters} />

      {isMobile ? (
        <div className="space-y-3">
          <TransactionsTable
            data={query.data?.items ?? []}
            state={state}
            page={query.data?.page ?? page}
            pageSize={query.data?.pageSize ?? pageSize}
            total={query.data?.total ?? 0}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[...PAGE_SIZE_OPTIONS]}
            onRetry={() => query.refetch()}
          />
          {query.data && state === 'data' ? (
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <SummaryFooter
                charged={query.data.totals.charged}
                commission={query.data.totals.commission}
                net={query.data.totals.net}
                standalone
              />
            </div>
          ) : null}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <TransactionsTable
            bare
            data={query.data?.items ?? []}
            state={state}
            page={query.data?.page ?? page}
            pageSize={query.data?.pageSize ?? pageSize}
            total={query.data?.total ?? 0}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[...PAGE_SIZE_OPTIONS]}
            onRetry={() => query.refetch()}
          />
          {query.data && state === 'data' ? (
            <SummaryFooter
              charged={query.data.totals.charged}
              commission={query.data.totals.commission}
              net={query.data.totals.net}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
