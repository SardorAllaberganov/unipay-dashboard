import { useQuery } from '@tanstack/react-query';
import { paymentsApi } from '../api';

export const REFUNDS_QUERY_KEY = ['refunds'] as const;

export function useRefunds(status: 'pending' | 'history') {
  return useQuery({
    queryKey: [...REFUNDS_QUERY_KEY, status] as const,
    queryFn: () => paymentsApi.listRefunds(status),
  });
}
