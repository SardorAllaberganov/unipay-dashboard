import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { settingsApi } from '../api';
import type { GeneralSettings } from '@/types/domain';

export const GENERAL_QUERY_KEY = ['settings', 'general'] as const;

export function useGeneralSettings() {
  return useQuery({
    queryKey: GENERAL_QUERY_KEY,
    queryFn: () => settingsApi.getGeneral(),
  });
}

export function useUpdateGeneralSettings() {
  const qc = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (patch: Partial<GeneralSettings>) => settingsApi.saveGeneral(patch),
    onSuccess: (data) => {
      qc.setQueryData(GENERAL_QUERY_KEY, data);
      toast.success(t('settings.general.savedToast'));
    },
    onError: () => {
      toast.error(t('common.errors.saveFailed'));
    },
  });
}
