import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { payoutsApi, type PayoutsListParams } from '../api';

export const PAYOUTS_QUERY_KEY = ['payouts'] as const;

export function payoutsListKey(params: PayoutsListParams) {
  return [...PAYOUTS_QUERY_KEY, 'list', params] as const;
}

export function usePayouts(params: PayoutsListParams) {
  return useQuery({
    queryKey: payoutsListKey(params),
    queryFn: () => payoutsApi.list(params),
    placeholderData: keepPreviousData,
  });
}
