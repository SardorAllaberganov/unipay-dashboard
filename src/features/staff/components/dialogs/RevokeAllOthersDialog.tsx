import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useRevokeAllOtherSessions } from '../../hooks/useStaffMutations';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffId: string;
  onSuccess?: () => void;
}

export function RevokeAllOthersDialog({
  open,
  onOpenChange,
  staffId,
  onSuccess,
}: Props) {
  const { t } = useTranslation();
  const mutation = useRevokeAllOtherSessions();

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('staff.sessions.revokeAllOthersTitle')}
      description={t('staff.sessions.revokeAllOthersBody')}
      destructive
      requireReason
      minReasonLength={20}
      reasonLabel={t('staff.sessions.revokeAllOthersReasonLabel')}
      confirmLabel={t('staff.sessions.revokeAllOthersConfirm')}
      loading={mutation.isPending}
      onConfirm={(reason) => {
        void (async () => {
          try {
            const res = await mutation.mutateAsync({
              id: staffId,
              reason: reason ?? '',
            });
            toast.success(
              t('staff.sessions.revokeAllSuccessToast', {
                count: res.revokedCount,
              })
            );
            onSuccess?.();
            onOpenChange(false);
          } catch {
            toast.error(t('staff.sessions.revokeAllErrorToast'));
          }
        })();
      }}
    />
  );
}
