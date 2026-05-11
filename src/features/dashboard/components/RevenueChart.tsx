import { useState } from 'react';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { formatCompact, formatNumber, formatUZS } from '@/lib/format';
import { useNetworkState } from '@/hooks/useNetworkState';
import { useRevenueSeries } from '../hooks/useRevenueSeries';
import type { DashboardDateRange, Granularity, RevenueMetric } from '../api';
import {
  ChartSkeleton,
  PanelErrorState,
  PanelOfflineNote,
  PanelOfflineState,
  PanelPartialNote,
} from '@/components/shared/PanelStates';

interface Props {
  range?: DashboardDateRange;
}

const tiyinsToUzs = (n: number) => Math.round(n / 100);

export function RevenueChart({ range }: Props) {
  const { t } = useTranslation();
  const online = useNetworkState();
  const [granularity, setGranularity] = useState<Granularity>('daily');
  const [metric, setMetric] = useState<RevenueMetric>('amount');

  const query = useRevenueSeries(granularity, metric, range);

  const body = (() => {
    if (query.isPending) return <ChartSkeleton heightClassName="h-64" />;
    if (query.isError) {
      if (!online) return <PanelOfflineState className="h-64" />;
      return <PanelErrorState className="h-64" onRetry={() => query.refetch()} />;
    }
    const series = query.data?.series ?? [];
    if (series.length === 0) {
      return (
        <div className="flex h-64 items-center justify-center rounded-md border border-dashed border-border bg-card/40 text-center text-sm text-muted-foreground">
          {t('dashboard.empty.noData')}
        </div>
      );
    }

    const displaySeries =
      metric === 'amount'
        ? series.map((p) => ({ ...p, display: tiyinsToUzs(p.value) }))
        : series.map((p) => ({ ...p, display: p.value }));

    return (
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={displaySeries}
            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
            barCategoryGap="22%"
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 13, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              minTickGap={20}
            />
            <YAxis
              tick={{ fontSize: 13, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickFormatter={(v: number) =>
                metric === 'amount' ? formatCompact(v) : formatNumber(v)
              }
              width={72}
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
              formatter={(value: number) => [
                metric === 'amount' ? formatUZS(value) : formatNumber(value),
                metric === 'amount'
                  ? t('dashboard.charts.tooltip.amount')
                  : t('dashboard.charts.tooltip.count'),
              ]}
              labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
            />
            <Bar
              dataKey="display"
              fill="hsl(var(--brand-600))"
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  })();

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <CardTitle>{t('dashboard.charts.revenue')}</CardTitle>

        <div className="flex flex-wrap items-center gap-3">
          <Tabs value={granularity} onValueChange={(v) => setGranularity(v as Granularity)}>
            <TabsList>
              <TabsTrigger value="daily">{t('dashboard.charts.daily')}</TabsTrigger>
              <TabsTrigger value="weekly">{t('dashboard.charts.weekly')}</TabsTrigger>
              <TabsTrigger value="monthly">{t('dashboard.charts.monthly')}</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <Label
              htmlFor="revenue-metric"
              className="text-sm text-muted-foreground"
            >
              {metric === 'amount'
                ? t('dashboard.charts.byAmount')
                : t('dashboard.charts.byCount')}
            </Label>
            <Switch
              id="revenue-metric"
              checked={metric === 'amount'}
              onCheckedChange={(c) => setMetric(c ? 'amount' : 'count')}
              aria-label={t('dashboard.charts.revenue')}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {!online && !query.isError ? <PanelOfflineNote /> : null}
        {query.data?._meta?.partial ? (
          <PanelPartialNote
            shown={query.data._meta.shown ?? query.data.series.length}
            total={query.data._meta.total ?? query.data.series.length}
          />
        ) : null}
        {body}
      </CardContent>
    </Card>
  );
}
