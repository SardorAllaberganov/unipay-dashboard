import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import type { StaffSession } from '@/types/domain';
import { useRevokeSession } from '../../hooks/useStaffMutations';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffId: string;
  session: StaffSession;
  onSuccess?: () => void;
}

export function RevokeSessionDialog({
  open,
  onOpenChange,
  staffId,
  session,
  onSuccess,
}: Props) {
  const { t } = useTranslation();
  const mutation = useRevokeSession();

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('staff.sessions.revokeOneTitle')}
      description={t('staff.sessions.revokeOneBody', { device: session.device })}
      destructive
      requireReason
      minReasonLength={20}
      reasonLabel={t('staff.sessions.revokeOneReasonLabel')}
      confirmLabel={t('staff.sessions.revokeOneConfirm')}
      loading={mutation.isPending}
      onConfirm={(reason) => {
        void (async () => {
          try {
            await mutation.mutateAsync({
              id: staffId,
              sessionId: session.id,
              reason: reason ?? '',
            });
            toast.success(t('staff.sessions.revokeSuccessToast'));
            onSuccess?.();
            onOpenChange(false);
          } catch {
            toast.error(t('staff.sessions.revokeErrorToast'));
          }
        })();
      }}
    />
  );
}
