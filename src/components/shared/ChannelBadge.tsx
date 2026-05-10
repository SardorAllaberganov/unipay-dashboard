import { Banknote, CreditCard, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { PaymentChannel } from '@/types/domain';

const ICONS: Record<PaymentChannel, LucideIcon> = {
  payme: Wallet,
  click: Wallet,
  uzum: Wallet,
  apelsin: Wallet,
  tezpay: Wallet,
  mpay: CreditCard,
  cash: Banknote,
  manual: CreditCard,
};

interface Props {
  channel: PaymentChannel;
  className?: string;
}

export function ChannelBadge({ channel, className }: Props) {
  const { t } = useTranslation();
  const Icon = ICONS[channel];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md bg-surface-2 px-2 py-0.5 text-xs font-medium text-foreground',
        className
      )}
    >
      <Icon className="size-3" aria-hidden />
      {t(`channels.${channel}`)}
    </span>
  );
}
