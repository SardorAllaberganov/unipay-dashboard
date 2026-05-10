import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { BankAccount } from '@/types/domain';
import { organizationApi, type ListResponse } from '../api';
import { BANK_ACCOUNTS_QUERY_KEY } from './useBankAccounts';

// MSW flips verification 'pending' -> 'verified' after 5s. We schedule a refetch
// shortly after so the UI catches the change without polling.
const VERIFICATION_FLIP_MS = 5500;

export function useBankAccountMutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (input: Partial<BankAccount>) => organizationApi.createBankAccount(input),
    onSuccess: (created) => {
      queryClient.setQueryData<ListResponse<BankAccount>>(
        BANK_ACCOUNTS_QUERY_KEY,
        (prev) => {
          const items = prev?.items ?? [];
          // If new account is default, unset others to match server state.
          const next = created.isDefault
            ? items.map((a) => ({ ...a, isDefault: false }))
            : items;
          return { items: [...next, created], _meta: prev?._meta };
        }
      );
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: BANK_ACCOUNTS_QUERY_KEY });
      }, VERIFICATION_FLIP_MS);
    },
  });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<BankAccount> }) =>
      organizationApi.updateBankAccount(id, patch),
    onSuccess: (updated) => {
      queryClient.setQueryData<ListResponse<BankAccount>>(
        BANK_ACCOUNTS_QUERY_KEY,
        (prev) => ({
          items: (prev?.items ?? []).map((a) => (a.id === updated.id ? updated : a)),
          _meta: prev?._meta,
        })
      );
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => organizationApi.deleteBankAccount(id),
    onSuccess: (_data, id) => {
      queryClient.setQueryData<ListResponse<BankAccount>>(
        BANK_ACCOUNTS_QUERY_KEY,
        (prev) => ({
          items: (prev?.items ?? []).filter((a) => a.id !== id),
          _meta: prev?._meta,
        })
      );
    },
  });

  const setDefault = useMutation({
    mutationFn: (id: string) => organizationApi.setDefaultBankAccount(id),
    onSuccess: (newDefault) => {
      queryClient.setQueryData<ListResponse<BankAccount>>(
        BANK_ACCOUNTS_QUERY_KEY,
        (prev) => ({
          items: (prev?.items ?? []).map((a) => ({
            ...a,
            isDefault: a.id === newDefault.id,
          })),
          _meta: prev?._meta,
        })
      );
    },
  });

  return { create, update, remove, setDefault };
}
