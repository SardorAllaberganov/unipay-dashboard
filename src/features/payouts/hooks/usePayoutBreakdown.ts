import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { payoutsApi, type PayoutBreakdownParams } from '../api';
import { PAYOUTS_QUERY_KEY } from './usePayouts';

export function usePayoutBreakdown(
  id: string | undefined,
  params: PayoutBreakdownParams,
) {
  return useQuery({
    queryKey: [...PAYOUTS_QUERY_KEY, 'breakdown', id, params] as const,
    queryFn: () => payoutsApi.breakdown(id!, params),
    enabled: !!id,
    placeholderData: keepPreviousData,
  });
}
