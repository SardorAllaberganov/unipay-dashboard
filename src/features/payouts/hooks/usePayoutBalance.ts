import { useQuery } from '@tanstack/react-query';
import { payoutsApi } from '../api';
import { PAYOUTS_QUERY_KEY } from './usePayouts';

export function usePayoutBalance() {
  return useQuery({
    queryKey: [...PAYOUTS_QUERY_KEY, 'balance'] as const,
    queryFn: () => payoutsApi.balance(),
  });
}

export function useVerifiedBankAccounts() {
  return useQuery({
    queryKey: [...PAYOUTS_QUERY_KEY, 'bank-accounts'] as const,
    queryFn: () => payoutsApi.bankAccounts(),
  });
}
