import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { WriteButton } from '@/components/unipay/WriteButton';
import type { StaffMember } from '@/types/domain';
import { useDeleteStaffAccount } from '../../hooks/useStaffMutations';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: StaffMember;
  onSuccess?: () => void;
}

const REASON_MIN = 20;

/**
 * 2-step destructive flow per §7.3:
 *  Step 1 — reason ≥ 20 chars.
 *  Step 2 — type the staff member's email verbatim to confirm (anti-misclick).
 *
 * Implemented as a single Dialog with `step` state — switching steps doesn't unmount the
 * dialog, so the entered reason carries over if the user navigates back from step 2.
 */
export function DeleteAccountDialog({
  open,
  onOpenChange,
  staff,
  onSuccess,
}: Props) {
  const { t } = useTranslation();
  const mutation = useDeleteStaffAccount();
  const [step, setStep] = useState<'reason' | 'confirm'>('reason');
  const [reason, setReason] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');

  useEffect(() => {
    if (open) {
      setStep('reason');
      setReason('');
      setConfirmEmail('');
    }
  }, [open]);

  const reasonOk = reason.trim().length >= REASON_MIN;
  const emailMatches =
    confirmEmail.trim().toLowerCase() === staff.email.trim().toLowerCase();

  const onConfirm = async (): Promise<void> => {
    try {
      await mutation.mutateAsync({
        id: staff.id,
        reason,
        emailConfirm: confirmEmail,
      });
      toast.success(t('staff.delete.successToast'));
      onSuccess?.();
      onOpenChange(false);
    } catch {
      toast.error(t('staff.delete.errorToast'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-danger" aria-hidden />
            <span>{t('staff.delete.title')}</span>
          </DialogTitle>
          <DialogDescription>
            {t('staff.delete.body', { name: staff.fullName || staff.email })}
          </DialogDescription>
        </DialogHeader>

        {step === 'reason' ? (
          <div className="space-y-2">
            <Label htmlFor="delete-account-reason">
              {t('staff.delete.reasonLabel')}
            </Label>
            <Textarea
              id="delete-account-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              minLength={REASON_MIN}
              placeholder={t('staff.delete.reasonPlaceholder')}
              aria-describedby="delete-account-reason-counter"
            />
            <p
              id="delete-account-reason-counter"
              className="text-sm text-muted-foreground"
            >
              {reason.trim().length}/{REASON_MIN}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="delete-account-confirm-email">
              {t('staff.delete.confirmEmailLabel')}
            </Label>
            <Input
              id="delete-account-confirm-email"
              type="email"
              autoComplete="off"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder={staff.email}
              aria-describedby="delete-account-confirm-hint"
            />
            <p
              id="delete-account-confirm-hint"
              className="text-sm text-muted-foreground"
            >
              {t('staff.delete.confirmEmailHint')}
            </p>
            {confirmEmail && !emailMatches ? (
              <p className="text-sm text-danger-700">
                {t('staff.delete.confirmEmailMismatch')}
              </p>
            ) : null}
          </div>
        )}

        <DialogFooter>
          {step === 'reason' ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={mutation.isPending}
              >
                {t('common.actions.cancel')}
              </Button>
              <Button
                type="button"
                onClick={() => setStep('confirm')}
                disabled={!reasonOk}
              >
                {t('staff.delete.next')}
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('reason')}
                disabled={mutation.isPending}
              >
                {t('staff.delete.back')}
              </Button>
              <WriteButton
                type="button"
                variant="destructive"
                onClick={() => void onConfirm()}
                disabled={!emailMatches}
                loading={mutation.isPending}
              >
                {t('staff.delete.confirmSubmit')}
              </WriteButton>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
