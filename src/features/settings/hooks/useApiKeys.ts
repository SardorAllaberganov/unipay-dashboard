import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { settingsApi, type CreateApiKeyBody } from '../api';

export const API_KEYS_QUERY_KEY = ['settings', 'api-keys'] as const;

export function useApiKeys() {
  return useQuery({
    queryKey: API_KEYS_QUERY_KEY,
    queryFn: () => settingsApi.listApiKeys(),
  });
}

export function useCreateApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateApiKeyBody) => settingsApi.createApiKey(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: API_KEYS_QUERY_KEY });
    },
  });
}

export function useRevealApiKey() {
  return useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      settingsApi.revealApiKey(id, { password }),
  });
}

export function useRegenerateApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      settingsApi.regenerateApiKey(id, { password }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: API_KEYS_QUERY_KEY });
    },
  });
}

export function useDeleteApiKey() {
  const qc = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      settingsApi.deleteApiKey(id, { reason }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: API_KEYS_QUERY_KEY });
      toast.success(t('settings.api.deletedToast'));
    },
  });
}
