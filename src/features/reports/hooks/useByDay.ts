import { useQuery } from '@tanstack/react-query';
import { reportsApi, type ReportDateRange } from '../api';

export function useByDay(range?: ReportDateRange) {
  return useQuery({
    queryKey: ['reports', 'by-day', range?.from ?? null, range?.to ?? null],
    queryFn: () => reportsApi.byDay(range),
  });
}
