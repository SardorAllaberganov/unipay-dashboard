import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCompact, formatPercent, formatUZS } from '@/lib/format';
import { useNetworkState } from '@/hooks/useNetworkState';
import {
  ChartSkeleton,
  PanelErrorState,
  PanelOfflineNote,
  PanelOfflineState,
  PanelPartialNote,
} from '@/components/shared/PanelStates';
import { useSummary } from '../hooks/useSummary';
import type { ReportDateRange } from '../api';

interface Props {
  range?: ReportDateRange;
}

const tiyinsToUzs = (n: number) => Math.round(n / 100);

export function ChannelBreakdownChart({ range }: Props) {
  const { t } = useTranslation();
  const online = useNetworkState();
  const query = useSummary(range);

  const channels = useMemo(() => query.data?.channels ?? [], [query.data]);
  const total = useMemo(() => channels.reduce((s, c) => s + c.amount, 0), [channels]);

  const rows = useMemo(
    () =>
      channels.map((c) => ({
        channel: c.channel,
        label: t(`reports.export.channels.${c.channel}`),
        value: tiyinsToUzs(c.amount),
        sharePct: total > 0 ? (c.amount / total) * 100 : 0,
      })),
    [channels, total, t],
  );

  const body = (() => {
    if (query.isPending) return <ChartSkeleton heightClassName="h-72" />;
    if (query.isError) {
      if (!online) return <PanelOfflineState className="h-72" />;
      return <PanelErrorState className="h-72" onRetry={() => query.refetch()} />;
    }
    if (rows.length === 0 || total === 0) {
      return (
        <div className="flex h-72 items-center justify-center rounded-md border border-dashed border-border bg-card/40 text-center text-sm text-muted-foreground">
          {t('reports.byDay.emptyBody')}
        </div>
      );
    }
    return (
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            layout="vertical"
            margin={{ top: 4, right: 16, bottom: 0, left: 0 }}
            barCategoryGap="22%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 13, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickFormatter={(v: number) => formatCompact(v)}
            />
            <YAxis
              dataKey="label"
              type="category"
              tick={{ fontSize: 13, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              width={92}
            />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))' }}
              contentStyle={{
                fontSize: 13,
                borderRadius: 8,
                border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--card))',
                color: 'hsl(var(--foreground))',
              }}
              formatter={(value: number, _name, item: { payload?: { sharePct?: number } }) => {
                const share = item.payload?.sharePct ?? 0;
                return [
                  `${formatUZS(value)} · ${formatPercent(share, 1)}`,
                  t('reports.charts.channels.tooltipAmount'),
                ];
              }}
              labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
            />
            <Bar
              dataKey="value"
              fill="hsl(var(--brand-600))"
              radius={[0, 4, 4, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  })();

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>{t('reports.charts.channels.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {!online && !query.isError ? <PanelOfflineNote /> : null}
        {query.data?._meta?.partial ? (
          <PanelPartialNote
            shown={query.data._meta.shown ?? rows.length}
            total={query.data._meta.total ?? rows.length}
          />
        ) : null}
        {body}
      </CardContent>
    </Card>
  );
}

