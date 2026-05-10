import { useQuery } from '@tanstack/react-query';
import { dashboardApi, type DashboardDateRange } from '../api';

export function usePaymentStatusBreakdown(range?: DashboardDateRange) {
  return useQuery({
    queryKey: ['dashboard', 'status-breakdown', range?.from ?? null, range?.to ?? null],
    queryFn: () => dashboardApi.statusBreakdown(range),
  });
}
