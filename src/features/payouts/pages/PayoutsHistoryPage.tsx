// /payouts — historical payouts list (Pattern A list page).
// Summary banner + paginated DataTable. URL state: ?page=&pageSize=.
// "Request payout" CTA in the page header surfaces only when plan === 'request'.
import { useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { useNetworkState } from '@/hooks/useNetworkState';
import type { DataTableState } from '@/components/shared/DataTable';
import { PayoutsTable } from '../components/PayoutsTable';
import { PayoutsSummaryBanner } from '../components/PayoutsSummaryBanner';
import { usePayouts } from '../hooks/usePayouts';
import { usePayoutBalance, useVerifiedBankAccounts } from '../hooks/usePayoutBalance';
import type { BankAccount } from '@/types/domain';

const PAGE_SIZE_OPTIONS = [25, 50, 100];

export default function PayoutsHistoryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const online = useNetworkState();
  const [params, setParams] = useSearchParams();

  const page = Math.max(1, Number(params.get('page') ?? '1') || 1);
  const pageSize = (() => {
    const raw = Number(params.get('pageSize') ?? '25');
    return PAGE_SIZE_OPTIONS.includes(raw) ? raw : 25;
  })();

  const query = usePayouts({ page, pageSize });
  const balance = usePayoutBalance();
  const banks = useVerifiedBankAccounts();

  const bankAccountsById = useMemo(() => {
    const map = new Map<string, BankAccount>();
    for (const ba of banks.data?.items ?? []) map.set(ba.id, ba);
    return map;
  }, [banks.data]);

  const updateParams = (next: { page?: number; pageSize?: number }) => {
    const newParams = new URLSearchParams(params);
    if (next.page !== undefined) newParams.set('page', String(next.page));
    if (next.pageSize !== undefined) {
      newParams.set('pageSize', String(next.pageSize));
      newParams.set('page', '1');
    }
    setParams(newParams, { replace: false });
  };

  // Banner: derive received-this-month + lastPayout from the same paginated response;
  // works for the typical first-page render and falls back cleanly when off-screen.
  const items = query.data?.items ?? [];
  const settledItems = items.filter((p) => p.status === 'settled');
  const thisMonth = (() => {
    const now = new Date();
    const monthKey = now.toISOString().slice(0, 7); // YYYY-MM
    return settledItems
      .filter((p) => (p.completedAt ?? p.periodTo).slice(0, 7) === monthKey)
      .reduce((s, p) => s + Number(p.net.amount), 0);
  })();
  const lastPayout = settledItems[0] ?? null;

  const tableState: DataTableState = !online
    ? 'offline'
    : query.isLoading
      ? 'loading'
      : query.isError
        ? 'error'
        : items.length === 0
          ? 'empty'
          : query.data?._meta?.partial
            ? 'partial'
            : 'data';

  const summaryState = !online
    ? 'offline'
    : query.isLoading
      ? 'loading'
      : query.isError
        ? 'error'
        : settledItems.length === 0
          ? 'empty'
          : 'data';

  const showRequestCta = balance.data?.plan === 'request';

  return (
    <div className="min-w-0">
      <PageHeader
        title={t('payouts.list.title')}
        description={t('payouts.list.description')}
        actions={
          showRequestCta ? (
            <Button
              type="button"
              onClick={() => navigate('/payouts/request', { state: { from: location.pathname + location.search } })}
            >
              <Plus className="mr-1.5 size-4" aria-hidden />
              {t('payouts.list.requestCta')}
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-col gap-6">
        <PayoutsSummaryBanner
          state={summaryState}
          receivedThisMonth={thisMonth}
          lastPayout={lastPayout ?? undefined}
          nextExpectedAt={balance.data?.nextExpectedAt ?? null}
          onRetry={() => query.refetch()}
        />
        <PayoutsTable
          state={tableState}
          data={items}
          bankAccountsById={bankAccountsById}
          page={page}
          pageSize={pageSize}
          total={query.data?.total ?? 0}
          onPageChange={(p) => updateParams({ page: p })}
          onPageSizeChange={(s) => updateParams({ pageSize: s })}
          onRetry={() => query.refetch()}
          partial={
            query.data?._meta?.partial
              ? {
                  shown: query.data?._meta?.shown ?? items.length,
                  total: query.data?._meta?.total ?? items.length,
                }
              : undefined
          }
        />
      </div>
    </div>
  );
}
