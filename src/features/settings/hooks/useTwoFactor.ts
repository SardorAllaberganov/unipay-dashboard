import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../api';

export const TWO_FA_QUERY_KEY = ['settings', '2fa'] as const;

export function useTwoFactor() {
  return useQuery({
    queryKey: TWO_FA_QUERY_KEY,
    queryFn: () => settingsApi.getTwoFa(),
  });
}

export function useInitTwoFa() {
  return useMutation({
    mutationFn: () => settingsApi.initTwoFa(),
  });
}

export function useVerifyTwoFa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => settingsApi.verifyTwoFa({ code }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: TWO_FA_QUERY_KEY });
    },
  });
}

export function useDisableTwoFa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { password: string; reason: string }) =>
      settingsApi.disableTwoFa(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: TWO_FA_QUERY_KEY });
    },
  });
}

export function useRegenerateRecoveryCodes() {
  return useMutation({
    mutationFn: (password: string) => settingsApi.regenerateRecoveryCodes({ password }),
  });
}
