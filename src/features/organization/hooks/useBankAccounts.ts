import { useQuery } from '@tanstack/react-query';
import { organizationApi } from '../api';

export const BANK_ACCOUNTS_QUERY_KEY = ['organization', 'bank-accounts'] as const;

export function useBankAccounts() {
  return useQuery({
    queryKey: BANK_ACCOUNTS_QUERY_KEY,
    queryFn: organizationApi.listBankAccounts,
  });
}
