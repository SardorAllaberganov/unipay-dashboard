// /payouts/:id — full-page Pattern A detail. Same shape as TransactionDetailPage.
// `pb-28` wrapper clears the fixed-bottom action bar. Renders summary section,
// horizontal StatusTimeline, and the paginated PayoutBreakdownTable.
import { useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { DetailPageSkeleton } from '@/components/shared/DetailPageSkeleton';
import { ErrorState } from '@/components/shared/ErrorState';
import { OfflineState } from '@/components/shared/OfflineState';
import { useNetworkState } from '@/hooks/useNetworkState';
import type { DataTableState } from '@/components/shared/DataTable';
import { formatMoney } from '@/lib/format';
import { PayoutDetailHeader } from '../components/PayoutDetailHeader';
import { PayoutDetailActionBar } from '../components/PayoutDetailActionBar';
import { StatusTimeline } from '../components/StatusTimeline';
import { PayoutBreakdownTable } from '../components/PayoutBreakdownTable';
import { usePayoutDetail } from '../hooks/usePayoutDetail';
import { usePayoutBreakdown } from '../hooks/usePayoutBreakdown';
import { useVerifiedBankAccounts } from '../hooks/usePayoutBalance';
import type { BankAccount } from '@/types/domain';

const PAGE_SIZE_OPTIONS = [25, 50, 100];

export default function PayoutDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const online = useNetworkState();
  const detail = usePayoutDetail(id);
  const banks = useVerifiedBankAccounts();

  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get('bdPage') ?? '1') || 1);
  const pageSize = (() => {
    const raw = Number(params.get('bdPageSize') ?? '50');
    return PAGE_SIZE_OPTIONS.includes(raw) ? raw : 50;
  })();

  const breakdown = usePayoutBreakdown(id, { page, pageSize });
  const bankAccount = useMemo(
    () =>
      banks.data?.items.find((b: BankAccount) => b.id === detail.data?.bankAccountId),
    [banks.data, detail.data],
  );

  const updateParams = (next: { bdPage?: number; bdPageSize?: number }) => {
    const newParams = new URLSearchParams(params);
    if (next.bdPage !== undefined) newParams.set('bdPage', String(next.bdPage));
    if (next.bdPageSize !== undefined) {
      newParams.set('bdPageSize', String(next.bdPageSize));
      newParams.set('bdPage', '1');
    }
    setParams(newParams, { replace: false });
  };

  if (!online) {
    return (
      <div className="pb-28">
        <OfflineState />
      </div>
    );
  }
  if (detail.isLoading) {
    return (
      <div className="pb-28">
        <DetailPageSkeleton avatar chips={3} tabs={0} />
      </div>
    );
  }
  if (detail.isError || !detail.data) {
    return (
      <div className="pb-28">
        <ErrorState
          onRetry={() => detail.refetch()}
          title={t('common.states.errorTitle')}
        />
      </div>
    );
  }

  const payout = detail.data;
  const breakdownItems = breakdown.data?.items ?? [];
  const breakdownState: DataTableState = breakdown.isLoading
    ? 'loading'
    : breakdown.isError
      ? 'error'
      : breakdownItems.length === 0
        ? 'empty'
        : breakdown.data?._meta?.partial
          ? 'partial'
          : 'data';

  return (
    <div className="min-w-0 pb-28">
      <PayoutDetailHeader payout={payout} bankAccount={bankAccount} />

      <div className="flex flex-col gap-6">
        {/* Summary */}
        <Card className="p-5 md:p-6">
          <h2 className="text-base font-semibold text-foreground">
            {t('payouts.detail.summary.title')}
          </h2>
          <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SummaryRow
              label={t('payouts.detail.summary.gross')}
              value={formatMoney(payout.gross)}
            />
            <SummaryRow
              label={t('payouts.detail.summary.commission')}
              value={formatMoney(payout.commission)}
              muted
            />
            <SummaryRow
              label={t('payouts.detail.summary.net')}
              value={formatMoney(payout.net)}
              emphasized
            />
          </dl>
        </Card>

        {/* Timeline */}
        <Card className="p-5 md:p-6">
          <h2 className="mb-4 text-base font-semibold text-foreground">
            {t('payouts.detail.timeline.title')}
          </h2>
          <StatusTimeline status={payout.status} />
        </Card>

        {/* Breakdown */}
        <section className="flex flex-col gap-3">
          <header className="flex flex-col gap-1">
            <h2 className="text-base font-semibold text-foreground">
              {t('payouts.detail.breakdown.title')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t('payouts.detail.breakdown.description')}
            </p>
          </header>
          <PayoutBreakdownTable
            state={breakdownState}
            data={breakdownItems}
            page={page}
            pageSize={pageSize}
            total={breakdown.data?.total ?? 0}
            onPageChange={(p) => updateParams({ bdPage: p })}
            onPageSizeChange={(s) => updateParams({ bdPageSize: s })}
            onRetry={() => breakdown.refetch()}
            partial={
              breakdown.data?._meta?.partial
                ? {
                    shown: breakdown.data?._meta?.shown ?? breakdownItems.length,
                    total: breakdown.data?._meta?.total ?? breakdownItems.length,
                  }
                : undefined
            }
          />
        </section>
      </div>

      <PayoutDetailActionBar payout={payout} bankAccount={bankAccount} />
    </div>
  );
}

function SummaryRow({
  label,
  value,
  muted,
  emphasized,
}: {
  label: string;
  value: string;
  muted?: boolean;
  emphasized?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd
        className={
          emphasized
            ? 'text-2xl font-semibold tabular font-mono text-foreground'
            : muted
              ? 'text-base tabular font-mono text-muted-foreground'
              : 'text-base tabular font-mono text-foreground'
        }
      >
        {value}
      </dd>
    </div>
  );
}
