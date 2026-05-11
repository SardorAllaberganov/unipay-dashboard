import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { paymentsApi, type PendingListParams } from '../api';

export const PENDING_QUERY_KEY = ['payments', 'pending'] as const;

export function pendingListKey(params: PendingListParams) {
  return [...PENDING_QUERY_KEY, params] as const;
}

export function usePendingOverdue(params: PendingListParams) {
  return useQuery({
    queryKey: pendingListKey(params),
    queryFn: () => paymentsApi.listPending(params),
    placeholderData: keepPreviousData,
  });
}
