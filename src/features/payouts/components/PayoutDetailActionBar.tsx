// Pattern A action bar for /payouts/:id (§0.5). Status-gated:
//   pending → [Подтвердить] (WriteButton, opens 2-step ConfirmPayoutDialog)
//             + [Отменить]   (WriteButton variant=destructive, opens CancelPayoutDialog)
//   else  → [Скачать выписку] (anchor to /api/payouts/:id/breakdown.xlsx)
import { useState } from 'react';
import { Download, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { WriteButton } from '@/components/unipay/WriteButton';
import { DetailActionBar } from '@/components/layout/DetailActionBar';
import { ConfirmPayoutDialog } from './ConfirmPayoutDialog';
import { CancelPayoutDialog } from './CancelPayoutDialog';
import { payoutsApi, type PayoutJson } from '../api';
import type { BankAccount } from '@/types/domain';

interface Props {
  payout: PayoutJson;
  bankAccount?: BankAccount;
}

export function PayoutDetailActionBar({ payout, bankAccount }: Props) {
  const { t } = useTranslation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  if (payout.status === 'pending') {
    return (
      <>
        <DetailActionBar>
          <WriteButton
            type="button"
            variant="destructive"
            onClick={() => setCancelOpen(true)}
            className="flex-1 md:flex-none"
          >
            <X className="mr-1.5 size-4" aria-hidden />
            {t('payouts.actions.cancel')}
          </WriteButton>
          <WriteButton
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="flex-1 md:flex-none"
          >
            <Check className="mr-1.5 size-4" aria-hidden />
            {t('payouts.actions.confirm')}
          </WriteButton>
        </DetailActionBar>

        <ConfirmPayoutDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          payout={payout}
          bankAccount={bankAccount}
        />
        <CancelPayoutDialog
          open={cancelOpen}
          onOpenChange={setCancelOpen}
          payout={payout}
        />
      </>
    );
  }

  return (
    <DetailActionBar>
      <Button asChild variant="outline" className="flex-1 md:flex-none">
        <a
          href={payoutsApi.statementUrl(payout.id)}
          target="_blank"
          rel="noopener"
          download
        >
          <Download className="mr-1.5 size-4" aria-hidden />
          {t('payouts.actions.downloadStatement')}
        </a>
      </Button>
    </DetailActionBar>
  );
}
