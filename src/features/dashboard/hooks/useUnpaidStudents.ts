import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api';

export function useUnpaidStudents(limit = 10) {
  return useQuery({
    queryKey: ['dashboard', 'unpaid-top', limit],
    queryFn: () => dashboardApi.unpaidTop(limit),
  });
}
