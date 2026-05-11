import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import type { StaffMember } from '@/types/domain';
import { useCancelInvite } from '../../hooks/useStaffMutations';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: StaffMember;
  onSuccess?: () => void;
}

export function DeleteInviteDialog({
  open,
  onOpenChange,
  staff,
  onSuccess,
}: Props) {
  const { t } = useTranslation();
  const mutation = useCancelInvite();

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('staff.cancelInvite.title')}
      description={t('staff.cancelInvite.body', { email: staff.email })}
      destructive
      confirmLabel={t('staff.cancelInvite.confirmCta')}
      loading={mutation.isPending}
      onConfirm={() => {
        void (async () => {
          try {
            await mutation.mutateAsync(staff.id);
            onSuccess?.();
            onOpenChange(false);
          } catch {
            toast.error(t('staff.cancelInvite.errorToast'));
          }
        })();
      }}
    />
  );
}
