import { useQuery } from '@tanstack/react-query';
import { settingsApi } from '../api';

export const BILLING_QUERY_KEY = ['settings', 'billing'] as const;

export function useBilling() {
  return useQuery({
    queryKey: BILLING_QUERY_KEY,
    queryFn: () => settingsApi.getBilling(),
  });
}
