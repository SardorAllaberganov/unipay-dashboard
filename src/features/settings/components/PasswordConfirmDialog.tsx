// Feature-local password-confirm dialog. Used by 4 flows inside Settings:
//   - Reveal API key plaintext (password only)
//   - Disable 2FA (password + reason ≥20)
//   - Reveal webhook signing secret (password only)
//   - Rotate webhook signing secret (password + reason ≥20)
//
// Promote to `src/components/shared/PasswordConfirmDialog.tsx` when a 3rd
// domain consumer appears outside Settings.
import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  destructive?: boolean;
  requireReason?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  /** Defaults to 20 (§0.9). */
  minReasonLength?: number;
  confirmLabel?: string;
  loading?: boolean;
  /** Surface a server-side error inline (e.g. invalid_password). */
  errorMessage?: string;
  onConfirm: (payload: { password: string; reason?: string }) => void;
}

export function PasswordConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  destructive,
  requireReason,
  reasonLabel,
  reasonPlaceholder,
  minReasonLength = 20,
  confirmLabel,
  loading,
  errorMessage,
  onConfirm,
}: Props) {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!open) {
      setPassword('');
      setReason('');
    }
  }, [open]);

  const passwordOk = password.length > 0;
  const reasonOk = !requireReason || reason.trim().length >= minReasonLength;
  const canSubmit = passwordOk && reasonOk && !loading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {destructive ? (
              <AlertTriangle className="size-5 text-danger" aria-hidden />
            ) : null}
            <span className={cn(destructive && 'text-danger-foreground')}>{title}</span>
          </DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="pwd-confirm-password">
              {t('settings.passwordConfirm.label')}
            </Label>
            <Input
              id="pwd-confirm-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!errorMessage}
            />
            {errorMessage ? (
              <p className="text-sm text-destructive" role="alert">
                {errorMessage}
              </p>
            ) : null}
          </div>

          {requireReason ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="pwd-confirm-reason">
                {reasonLabel ?? t('common.reasonLabel', { count: minReasonLength })}
              </Label>
              <Textarea
                id="pwd-confirm-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder={reasonPlaceholder ?? t('common.reasonPlaceholder')}
              />
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {t('common.actions.cancel')}
          </Button>
          <Button
            variant={destructive ? 'destructive' : 'default'}
            disabled={!canSubmit}
            loading={loading}
            onClick={() =>
              onConfirm({ password, reason: requireReason ? reason : undefined })
            }
          >
            {confirmLabel ?? t('common.actions.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
