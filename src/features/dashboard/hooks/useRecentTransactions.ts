import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api';

export function useRecentTransactions(limit = 10) {
  return useQuery({
    queryKey: ['dashboard', 'recent-transactions', limit],
    queryFn: () => dashboardApi.recentTransactions(limit),
  });
}
