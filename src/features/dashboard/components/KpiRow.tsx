import { AlertCircle, Clock, Wallet, Landmark } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDate, formatRelative, formatUZS } from '@/lib/format';
import { useNetworkState } from '@/hooks/useNetworkState';
import { useDashboardSummary } from '../hooks/useDashboardSummary';
import type { DashboardDateRange } from '../api';
import { KpiCard } from '@/components/shared/KpiCard';
import {
  KpiCardSkeleton,
  PanelErrorState,
  PanelOfflineNote,
  PanelOfflineState,
  PanelPartialNote,
} from '@/components/shared/PanelStates';

interface Props {
  range?: DashboardDateRange;
}

// Converts minor units (tiyins) to UZS for display via formatUZS.
const tiyinsToUzs = (tiyins: number) => Math.round(tiyins / 100);

export function KpiRow({ range }: Props) {
  const { t } = useTranslation();
  const online = useNetworkState();
  const query = useDashboardSummary(range);

  // Loading — never reflow into data
  if (query.isPending) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Error — full-row retry
  if (query.isError) {
    if (!online) {
      return <PanelOfflineState />;
    }
    return <PanelErrorState onRetry={() => query.refetch()} />;
  }

  const data = query.data;
  if (!data) {
    return <PanelOfflineState />;
  }

  // Empty — when all key metrics are zero. Rare in practice but covered for §0.8.
  const isEmpty =
    data.totalReceived.amount === 0 &&
    data.pending.count === 0 &&
    data.overdue.count === 0 &&
    !data.lastPayout;

  if (isEmpty) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card/40 p-6 text-center text-sm text-muted-foreground">
        {t('dashboard.empty.noData')}
      </div>
    );
  }

  const totalUzs = tiyinsToUzs(data.totalReceived.amount);
  const overdueUzs = tiyinsToUzs(data.overdue.amount);
  const lastPayoutUzs = data.lastPayout ? tiyinsToUzs(data.lastPayout.amount) : null;

  return (
    <div className="space-y-3">
      {!online ? <PanelOfflineNote /> : null}
      {data._meta?.partial ? (
        <PanelPartialNote shown={data._meta.shown ?? 0} total={data._meta.total ?? 4} />
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={Wallet}
          label={t('dashboard.kpi.totalReceived')}
          value={formatUZS(totalUzs)}
          delta={data.totalReceived.deltaPct}
          deltaLabel={t('dashboard.kpi.vsLastPeriod')}
          spark={data.totalReceived.spark.map(tiyinsToUzs)}
        />

        <KpiCard
          icon={Clock}
          label={t('dashboard.kpi.pending')}
          value={String(data.pending.count)}
          subtitle={t('dashboard.kpi.pendingSubtitle', {
            count: data.pending.studentsWithDebt,
          })}
          spark={data.pending.spark}
          to="/payments/pending"
        />

        <KpiCard
          icon={AlertCircle}
          label={t('dashboard.kpi.overdue')}
          value={String(data.overdue.count)}
          subtitle={formatUZS(overdueUzs)}
          valueTone="destructive"
          spark={data.overdue.spark.map(tiyinsToUzs)}
          to="/payments/pending?tab=overdue"
        />

        <KpiCard
          icon={Landmark}
          label={t('dashboard.kpi.lastPayout')}
          value={lastPayoutUzs !== null ? formatUZS(lastPayoutUzs) : '—'}
          subtitle={
            lastPayoutUzs !== null && data.lastPayout
              ? `${formatDate(data.lastPayout.date)} · ${t('dashboard.kpi.nextPayout', {
                  when: data.nextPayout ? formatRelative(data.nextPayout.date) : '—',
                })}`
              : t('dashboard.kpi.noPayoutYet')
          }
        />
      </div>
    </div>
  );
}
