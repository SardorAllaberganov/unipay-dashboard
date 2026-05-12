// Cancel a pending payout. Reason ≥20 chars (§0.9 v2.0 destructive threshold).
// Uses the shared <ConfirmDialog> for the destructive reason-note pattern.
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { REASON_MIN_LENGTH } from '../api';
import { useCancelPayout } from '../hooks/useCancelPayout';
import type { PayoutJson } from '../api';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payout: PayoutJson;
  onSuccess?: (updated: PayoutJson) => void;
}

export function CancelPayoutDialog({ open, onOpenChange, payout, onSuccess }: Props) {
  const { t } = useTranslation();
  const cancel = useCancelPayout(payout.id);

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(next) => {
        if (cancel.isPending) return;
        onOpenChange(next);
      }}
      destructive
      requireReason
      minReasonLength={REASON_MIN_LENGTH}
      title={t('payouts.cancel.title')}
      description={t('payouts.cancel.body')}
      reasonLabel={t('payouts.cancel.reasonLabel', { count: REASON_MIN_LENGTH })}
      reasonPlaceholder={t('payouts.cancel.reasonPlaceholder')}
      confirmLabel={t('payouts.cancel.submit')}
      loading={cancel.isPending}
      onConfirm={(reason) => {
        cancel.mutate(
          { reason: (reason ?? '').trim() },
          {
            onSuccess: (updated) => {
              toast.success(t('payouts.cancel.successToast'));
              onSuccess?.(updated);
              onOpenChange(false);
            },
            onError: (err: unknown) => {
              const msg = err instanceof Error ? err.message : t('errors.generic');
              toast.error(msg);
            },
          },
        );
      }}
    />
  );
}
