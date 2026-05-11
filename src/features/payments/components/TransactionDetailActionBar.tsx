// Pattern A action bar for the transaction detail full page (§0.5). Two buttons:
// [Скачать чек] + [Возврат] (destructive). Refund is gated by getRefundEligibility —
// tooltip explains why when disabled.
import { useState } from 'react';
import { Download, Undo2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { WriteButton } from '@/components/unipay/WriteButton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getRefundEligibility } from '@/lib/refundEligibility';
import { DetailActionBar } from '@/components/layout/DetailActionBar';
import { RefundDialog } from './RefundDialog';
import type { Transaction } from '@/types/domain';

interface Props {
  transaction: Transaction;
  onDownloadReceipt: () => void;
}

export function TransactionDetailActionBar({ transaction, onDownloadReceipt }: Props) {
  const { t } = useTranslation();
  const [refundOpen, setRefundOpen] = useState(false);
  const eligibility = getRefundEligibility(transaction);
  const showReceipt = transaction.status === 'paid' || transaction.status === 'refunded';

  return (
    <>
      <DetailActionBar>
        {showReceipt ? (
          <Button
            type="button"
            variant="outline"
            onClick={onDownloadReceipt}
            className="flex-1 md:flex-none"
          >
            <Download className="mr-1.5 size-4" aria-hidden />
            {t('payments.detail.downloadReceipt')}
          </Button>
        ) : null}
        {eligibility.eligible ? (
          <WriteButton
            type="button"
            variant="destructive"
            onClick={() => setRefundOpen(true)}
            className="flex-1 md:flex-none"
          >
            <Undo2 className="mr-1.5 size-4" aria-hidden />
            {t('payments.list.actions.refund')}
          </WriteButton>
        ) : transaction.status === 'paid' || transaction.status === 'refunded' ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0} className="flex-1 md:flex-none">
                <WriteButton
                  type="button"
                  variant="destructive"
                  disabled
                  className="w-full md:w-auto"
                >
                  <Undo2 className="mr-1.5 size-4" aria-hidden />
                  {t('payments.list.actions.refund')}
                </WriteButton>
              </span>
            </TooltipTrigger>
            {eligibility.reasonKey ? (
              <TooltipContent>{t(eligibility.reasonKey)}</TooltipContent>
            ) : null}
          </Tooltip>
        ) : null}
      </DetailActionBar>

      <RefundDialog
        open={refundOpen}
        onOpenChange={setRefundOpen}
        transaction={transaction}
        onSuccess={() => setRefundOpen(false)}
      />
    </>
  );
}
