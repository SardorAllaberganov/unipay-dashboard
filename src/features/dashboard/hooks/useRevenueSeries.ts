import { useQuery } from '@tanstack/react-query';
import {
  dashboardApi,
  type DashboardDateRange,
  type Granularity,
  type RevenueMetric,
} from '../api';

export function useRevenueSeries(
  granularity: Granularity,
  metric: RevenueMetric,
  range?: DashboardDateRange,
) {
  return useQuery({
    queryKey: [
      'dashboard',
      'revenue',
      granularity,
      metric,
      range?.from ?? null,
      range?.to ?? null,
    ],
    queryFn: () => dashboardApi.revenue(granularity, metric, range),
  });
}
