// Wraps <ReceiptPreviewIframe> in a Dialog. The receipt is rendered in a portal-style modal
// so the iframe sizes generously without crowding the rest of the detail page.
import { Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ReceiptPreviewIframe } from './ReceiptPreviewIframe';
import type { Transaction } from '@/types/domain';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction;
}

export function ReceiptPreviewDialog({ open, onOpenChange, transaction }: Props) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Dialog sizes to its content; capped at 92dvh with overflow for very tall receipts. */}
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t('payments.detail.receiptHeading')}</DialogTitle>
        </DialogHeader>
        <ReceiptPreviewIframe transaction={transaction} />
        <DialogFooter className="gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            {t('common.actions.close')}
          </Button>
          <Button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') window.print();
            }}
          >
            <Download className="mr-1.5 size-4" aria-hidden />
            {t('payments.detail.downloadReceipt')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
