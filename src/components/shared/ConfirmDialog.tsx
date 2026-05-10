import { useEffect, useState, type ReactNode } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  destructive?: boolean;
  requireReason?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  /** Minimum reason length. Defaults to 20 (§0.9 v2.0 destructive). Use 10 for low-stakes notes. */
  minReasonLength?: number;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: (reason?: string) => void;
}

export function ConfirmDialog({
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
  cancelLabel,
  loading,
  onConfirm,
}: Props) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!open) setReason('');
  }, [open]);

  const reasonOk = !requireReason || reason.trim().length >= minReasonLength;

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

        {requireReason ? (
          <div className="space-y-2">
            <Label htmlFor="confirm-reason">
              {reasonLabel ?? t('common.reasonLabel', { count: minReasonLength })}
            </Label>
            <Textarea
              id="confirm-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              minLength={minReasonLength}
              rows={3}
              placeholder={reasonPlaceholder ?? t('common.reasonPlaceholder')}
            />
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {cancelLabel ?? t('common.cancel')}
          </Button>
          <Button
            variant={destructive ? 'destructive' : 'default'}
            onClick={() => onConfirm(requireReason ? reason : undefined)}
            disabled={!reasonOk || loading}
            loading={loading}
          >
            {confirmLabel ?? t('common.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
