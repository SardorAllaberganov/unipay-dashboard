// Pattern A header for /payouts/:id. BackLink → identity row (mono PayoutId copy +
// large net amount + StatusBadge) → chips row (period · MaskedAccount · tx count).
// Header flows inline (no sticky, no border-b strip — per §0.5).
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BackLink } from '@/components/shared/BackLink';
import { StatusBadge, type StatusBadgeVariant } from '@/components/shared/StatusBadge';
import { MaskedAccount } from '@/components/unipay/MaskedAccount';
import { formatDate, formatMoney, formatNumber } from '@/lib/format';
import type { BankAccount, PayoutStatus } from '@/types/domain';
import type { PayoutJson } from '../api';
import { PayoutIdCopy } from './PayoutIdCopy';

const STATUS_TO_VARIANT: Record<PayoutStatus, StatusBadgeVariant> = {
  settled: 'paid',
  pending: 'pending',
  failed: 'failed',
};

interface Props {
  payout: PayoutJson;
  bankAccount?: BankAccount;
}

export function PayoutDetailHeader({ payout, bankAccount }: Props) {
  const { t } = useTranslation();
  const location = useLocation();
  const backTo = (location.state as { from?: string } | null)?.from ?? '/payouts';

  return (
    <div className="mb-6 flex flex-col gap-3">
      <BackLink to={backTo} pluralName={t('payouts.backPlural')} />

      <div className="flex flex-wrap items-baseline gap-3">
        <PayoutIdCopy value={payout.id} />
        <span className="text-2xl font-mono font-semibold tabular text-foreground md:text-3xl">
          {formatMoney(payout.net)}
        </span>
        <StatusBadge variant={STATUS_TO_VARIANT[payout.status]} />
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
        <span className="text-foreground tabular whitespace-nowrap">
          {formatDate(payout.periodFrom)} – {formatDate(payout.periodTo)}
        </span>
        {bankAccount ? (
          <>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1.5">
              <span>{bankAccount.bankName}</span>
              <MaskedAccount value={bankAccount.accountNumber} className="text-xs" />
            </span>
          </>
        ) : null}
        <span aria-hidden>·</span>
        <span className="tabular whitespace-nowrap">
          {t('payouts.detail.transactionsCount', {
            count: payout.transactionsCount,
            n: formatNumber(payout.transactionsCount),
          })}
        </span>
        {payout.bankRef ? (
          <>
            <span aria-hidden>·</span>
            <span className="font-mono text-xs">
              {t('payouts.detail.bankRefLabel')}: {payout.bankRef}
            </span>
          </>
        ) : null}
      </div>
    </div>
  );
}
