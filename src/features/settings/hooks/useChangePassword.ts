import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { settingsApi, type ChangePasswordBody } from '../api';

export function useChangePassword() {
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (body: ChangePasswordBody) => settingsApi.changePassword(body),
    onSuccess: () => {
      toast.success(t('settings.security.password.savedToast'));
    },
  });
}
