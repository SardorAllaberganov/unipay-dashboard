import { useQuery } from '@tanstack/react-query';
import { reportsApi, type ReportDateRange } from '../api';

export function useSummary(range?: ReportDateRange) {
  return useQuery({
    queryKey: ['reports', 'summary', range?.from ?? null, range?.to ?? null],
    queryFn: () => reportsApi.summary(range),
  });
}
