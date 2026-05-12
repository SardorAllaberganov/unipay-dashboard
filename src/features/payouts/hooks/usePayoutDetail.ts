import { useQuery } from '@tanstack/react-query';
import { payoutsApi } from '../api';
import { PAYOUTS_QUERY_KEY } from './usePayouts';

export function usePayoutDetail(id: string | undefined) {
  return useQuery({
    queryKey: [...PAYOUTS_QUERY_KEY, 'detail', id] as const,
    queryFn: () => payoutsApi.get(id!),
    enabled: !!id,
  });
}
