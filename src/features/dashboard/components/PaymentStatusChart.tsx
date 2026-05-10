import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNumber } from '@/lib/format';
import { useNetworkState } from '@/hooks/useNetworkState';
import { usePaymentStatusBreakdown } from '../hooks/usePaymentStatusBreakdown';
import type { DashboardDateRange } from '../api';
import {
  ChartSkeleton,
  PanelErrorState,
  PanelOfflineNote,
  PanelOfflineState,
  PanelPartialNote,
} from './PanelStates';

interface Props {
  range?: DashboardDateRange;
}

type SliceKey = 'paid' | 'pending' | 'overdue';

const SLICE_COLOR: Record<SliceKey, string> = {
  paid: 'hsl(var(--success-600))',
  pending: 'hsl(var(--warning-600))',
  overdue: 'hsl(var(--destructive))',
};

export function PaymentStatusChart({ range }: Props) {
  const { t } = useTranslation();
  const online = useNetworkState();
  const query = usePaymentStatusBreakdown(range);

  const body = (() => {
    if (query.isPending) return <ChartSkeleton heightClassName="h-56" />;
    if (query.isError) {
      if (!online) return <PanelOfflineState className="h-56" />;
      return <PanelErrorState className="h-56" onRetry={() => query.refetch()} />;
    }
    const data = query.data;
    if (!data || data.totalStudents === 0) {
      return (
        <div className="flex h-56 items-center justify-center rounded-md border border-dashed border-border bg-card/40 text-center text-sm text-muted-foreground">
          {t('dashboard.empty.noData')}
        </div>
      );
    }

    const slices = data.slices.map((s) => ({
      ...s,
      label: t(`dashboard.charts.legend.${s.status}`),
      color: SLICE_COLOR[s.status],
    }));

    return (
      <div className="space-y-3">
        <div className="relative h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                dataKey="count"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={64}
                outerRadius={92}
                paddingAngle={2}
                stroke="hsl(var(--card))"
                strokeWidth={2}
                isAnimationActive={false}
              >
                {slices.map((slice) => (
                  <Cell key={slice.status} fill={slice.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  fontSize: 13,
                  borderRadius: 8,
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--card))',
                  color: 'hsl(var(--foreground))',
                }}
                formatter={(value: number) => [formatNumber(value), t('dashboard.charts.tooltip.count')]}
                labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl tabular font-mono font-semibold text-foreground">
              {formatNumber(data.totalStudents)}
            </span>
            <span className="text-sm text-muted-foreground">
              {t('dashboard.charts.totalStudents')}
            </span>
          </div>
        </div>

        <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
          {slices.map((slice) => (
            <li key={slice.status} className="inline-flex items-center gap-2">
              <span
                aria-hidden
                className="inline-block size-2.5 rounded-sm"
                style={{ background: slice.color }}
              />
              <span className="text-foreground">{slice.label}</span>
              <span className="tabular text-muted-foreground">
                {formatNumber(slice.count)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  })();

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>{t('dashboard.charts.statusBreakdown')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {!online && !query.isError ? <PanelOfflineNote /> : null}
        {query.data?._meta?.partial ? (
          <PanelPartialNote
            shown={query.data._meta.shown ?? query.data.slices.length}
            total={query.data._meta.total ?? 3}
          />
        ) : null}
        {body}
      </CardContent>
    </Card>
  );
}
