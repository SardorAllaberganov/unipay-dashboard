import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { settingsApi, type SaveNotificationsBody } from '../api';

export const NOTIFICATIONS_QUERY_KEY = ['settings', 'notifications'] as const;

export function useNotificationsConfig() {
  return useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: () => settingsApi.getNotifications(),
  });
}

export function useSaveNotificationsConfig() {
  const qc = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (body: SaveNotificationsBody) => settingsApi.saveNotifications(body),
    onSuccess: (data) => {
      qc.setQueryData(NOTIFICATIONS_QUERY_KEY, data);
      toast.success(t('settings.notifications.savedToast'));
    },
  });
}
