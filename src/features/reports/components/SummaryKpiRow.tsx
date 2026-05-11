import { useTranslation } from 'react-i18next';
import { Banknote, Landmark, Percent, Wallet } from 'lucide-react';
import { KpiCard } from '@/components/shared/KpiCard';
import {
  KpiCardSkeleton,
  PanelErrorState,
  PanelOfflineNote,
  PanelOfflineState,
  PanelPartialNote,
} from '@/components/shared/PanelStates';
import { useNetworkState } from '@/hooks/useNetworkState';
import { formatNumber, formatUZS } from '@/lib/format';
import { useSummary } from '../hooks/useSummary';
import type { ReportDateRange } from '../api';

interface Props {
  range?: ReportDateRange;
}

// MSW wires Money.amount as a JS number on the wire (BigInt → toJSON patch in main.tsx).
// UI converts tiyins → UZS major units for formatUZS at display time.
const tiyinsToUzs = (n: number) => Math.round(n / 100);

export function SummaryKpiRow({ range }: Props) {
  const { t } = useTranslation();
  const online = useNetworkState();
  const query = useSummary(range);

  if (query.isPending) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>
    );
  }
  if (query.isError) {
    if (!online) return <PanelOfflineState />;
    return <PanelErrorState onRetry={() => query.refetch()} />;
  }
  const data = query.data;
  if (!data) return <PanelOfflineState />;

  const isEmpty =
    data.totalReceived.amount === 0 &&
    data.totalCommission.amount === 0 &&
    data.totalNet.amount === 0 &&
    data.payoutCount.count === 0;

  if (isEmpty) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card/40 p-6 text-center text-sm text-muted-foreground">
        {t('reports.byDay.emptyBody')}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!online ? <PanelOfflineNote /> : null}
      {data._meta?.partial ? (
        <PanelPartialNote shown={data._meta.shown ?? 0} total={data._meta.total ?? 4} />
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={Wallet}
          label={t('reports.kpis.totalReceived')}
          value={formatUZS(tiyinsToUzs(data.totalReceived.amount))}
          delta={data.totalReceived.deltaPct}
          deltaLabel={t('reports.kpis.vsPrev')}
          spark={data.totalReceived.spark.map(tiyinsToUzs)}
        />
        <KpiCard
          icon={Percent}
          label={t('reports.kpis.totalCommission')}
          value={formatUZS(tiyinsToUzs(data.totalCommission.amount))}
          delta={data.totalCommission.deltaPct}
          deltaLabel={t('reports.kpis.vsPrev')}
          spark={data.totalCommission.spark.map(tiyinsToUzs)}
        />
        <KpiCard
          icon={Banknote}
          label={t('reports.kpis.totalNet')}
          value={formatUZS(tiyinsToUzs(data.totalNet.amount))}
          delta={data.totalNet.deltaPct}
          deltaLabel={t('reports.kpis.vsPrev')}
          spark={data.totalNet.spark.map(tiyinsToUzs)}
        />
        <KpiCard
          icon={Landmark}
          label={t('reports.kpis.payoutCount')}
          value={formatNumber(data.payoutCount.count)}
          delta={data.payoutCount.deltaPct}
          deltaLabel={t('reports.kpis.vsPrev')}
          subtitle={t('reports.kpis.payoutCountUnit', { count: data.payoutCount.count })}
        />
      </div>
    </div>
  );
}
