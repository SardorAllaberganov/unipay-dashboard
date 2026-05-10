import { useQuery } from '@tanstack/react-query';
import { dashboardApi, type DashboardDateRange } from '../api';

export function useDashboardSummary(range?: DashboardDateRange) {
  return useQuery({
    queryKey: ['dashboard', 'summary', range?.from ?? null, range?.to ?? null],
    queryFn: () => dashboardApi.summary(range),
  });
}
