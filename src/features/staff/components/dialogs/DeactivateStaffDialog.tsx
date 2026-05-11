import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import type { StaffMember } from '@/types/domain';
import { useDeactivateStaff } from '../../hooks/useStaffMutations';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: StaffMember;
  onSuccess?: () => void;
}

/**
 * Thin wrapper around `<ConfirmDialog requireReason minReasonLength={20}>`
 * that binds the staff context (name interpolation, mutation hook, toast).
 */
export function DeactivateStaffDialog({
  open,
  onOpenChange,
  staff,
  onSuccess,
}: Props) {
  const { t } = useTranslation();
  const mutation = useDeactivateStaff();

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('staff.deactivate.title')}
      description={t('staff.deactivate.body', {
        name: staff.fullName || staff.email,
      })}
      destructive
      requireReason
      minReasonLength={20}
      reasonLabel={t('staff.deactivate.reasonLabel')}
      reasonPlaceholder={t('staff.deactivate.reasonPlaceholder')}
      confirmLabel={t('staff.deactivate.confirmCta')}
      loading={mutation.isPending}
      onConfirm={(reason) => {
        void (async () => {
          try {
            await mutation.mutateAsync({ id: staff.id, reason: reason ?? '' });
            onSuccess?.();
            onOpenChange(false);
          } catch {
            toast.error(t('staff.deactivate.errorToast'));
          }
        })();
      }}
    />
  );
}
