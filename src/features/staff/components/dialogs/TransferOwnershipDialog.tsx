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
import { useTransferOwnership } from '../../hooks/useStaffMutations';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Recipient — the staff member who will become the new Owner. */
  staff: StaffMember;
  onSuccess?: () => void;
}

const REASON_MIN = 20;
const PHRASE = 'TRANSFER';

/**
 * 2-step transfer flow per §7.3:
 *  Step 1 — reason ≥ 20 chars.
 *  Step 2 — type "TRANSFER" verbatim to confirm.
 * Server promotes recipient to Owner and demotes the current Owner to Finance Manager.
 */
export function TransferOwnershipDialog({
  open,
  onOpenChange,
  staff,
  onSuccess,
}: Props) {
  const { t } = useTranslation();
  const mutation = useTransferOwnership();
  const [step, setStep] = useState<'reason' | 'confirm'>('reason');
  const [reason, setReason] = useState('');
  const [phrase, setPhrase] = useState('');

  useEffect(() => {
    if (open) {
      setStep('reason');
      setReason('');
      setPhrase('');
    }
  }, [open]);

  const reasonOk = reason.trim().length >= REASON_MIN;
  const phraseMatches = phrase === PHRASE;

  const onConfirm = async (): Promise<void> => {
    try {
      await mutation.mutateAsync({
        id: staff.id,
        reason,
        confirmPhrase: phrase,
      });
      toast.success(
        t('staff.transfer.successToast', {
          name: staff.fullName || staff.email,
        })
      );
      onSuccess?.();
      onOpenChange(false);
    } catch {
      toast.error(t('staff.transfer.errorToast'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-danger" aria-hidden />
            <span>{t('staff.transfer.title')}</span>
          </DialogTitle>
          <DialogDescription>
            {t('staff.transfer.body', { name: staff.fullName || staff.email })}
          </DialogDescription>
        </DialogHeader>

        {step === 'reason' ? (
          <div className="space-y-2">
            <Label htmlFor="transfer-reason">
              {t('staff.transfer.reasonLabel')}
            </Label>
            <Textarea
              id="transfer-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              minLength={REASON_MIN}
              placeholder={t('staff.transfer.reasonPlaceholder')}
              aria-describedby="transfer-reason-counter"
            />
            <p
              id="transfer-reason-counter"
              className="text-sm text-muted-foreground"
            >
              {reason.trim().length}/{REASON_MIN}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="transfer-confirm-phrase">
              {t('staff.transfer.confirmPhraseLabel')}
            </Label>
            <Input
              id="transfer-confirm-phrase"
              type="text"
              autoComplete="off"
              autoCapitalize="characters"
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              placeholder={PHRASE}
              className="font-mono uppercase tracking-wider"
            />
            {phrase && !phraseMatches ? (
              <p className="text-sm text-danger-700">
                {t('staff.transfer.confirmPhraseMismatch')}
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
                {t('staff.transfer.next')}
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
                {t('staff.transfer.back')}
              </Button>
              <WriteButton
                type="button"
                variant="destructive"
                onClick={() => void onConfirm()}
                disabled={!phraseMatches}
                loading={mutation.isPending}
              >
                {t('staff.transfer.confirmSubmit')}
              </WriteButton>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
