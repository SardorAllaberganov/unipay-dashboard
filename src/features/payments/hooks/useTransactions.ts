import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { paymentsApi, type TransactionsListParams } from '../api';

export const TRANSACTIONS_QUERY_KEY = ['transactions'] as const;

export function transactionsListKey(params: TransactionsListParams) {
  return [...TRANSACTIONS_QUERY_KEY, 'list', params] as const;
}

export function useTransactions(params: TransactionsListParams) {
  return useQuery({
    queryKey: transactionsListKey(params),
    queryFn: () => paymentsApi.listTransactions(params),
    placeholderData: keepPreviousData,
  });
}

export function useTransaction(id: string | undefined) {
  return useQuery({
    queryKey: [...TRANSACTIONS_QUERY_KEY, 'detail', id] as const,
    queryFn: () => paymentsApi.getTransaction(id!),
    enabled: !!id,
  });
}
