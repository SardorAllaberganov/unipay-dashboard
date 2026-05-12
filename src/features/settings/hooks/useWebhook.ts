import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { settingsApi } from '../api';
import type { WebhookEvent } from '@/types/domain';

export const WEBHOOK_QUERY_KEY = ['settings', 'webhook'] as const;
export const WEBHOOK_DELIVERIES_QUERY_KEY = ['settings', 'webhook-deliveries'] as const;

export function useWebhookConfig() {
  return useQuery({
    queryKey: WEBHOOK_QUERY_KEY,
    queryFn: () => settingsApi.getWebhook(),
  });
}

export function useSaveWebhookConfig() {
  const qc = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (body: { url: string; events: WebhookEvent[]; enabled: boolean }) =>
      settingsApi.saveWebhook(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: WEBHOOK_QUERY_KEY });
      toast.success(t('settings.webhook.savedToast'));
    },
  });
}

export function useTestWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => settingsApi.testWebhook(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: WEBHOOK_DELIVERIES_QUERY_KEY });
    },
  });
}

export function useWebhookDeliveries() {
  return useQuery({
    queryKey: WEBHOOK_DELIVERIES_QUERY_KEY,
    queryFn: () => settingsApi.listWebhookDeliveries(),
  });
}

export function useRetryWebhookDelivery() {
  const qc = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (id: string) => settingsApi.retryWebhookDelivery(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: WEBHOOK_DELIVERIES_QUERY_KEY });
      toast.success(t('settings.webhook.retryToast'));
    },
  });
}

export function useRevealWebhookSecret() {
  return useMutation({
    mutationFn: (password: string) =>
      settingsApi.revealWebhookSecret({ password }),
  });
}

export function useRotateWebhookSecret() {
  const { t } = useTranslation();
  return useMutation({
    mutationFn: ({ password, reason }: { password: string; reason: string }) =>
      settingsApi.rotateWebhookSecret({ password, reason }),
    onSuccess: () => {
      toast.success(t('settings.webhook.secretRotatedToast'));
    },
  });
}
