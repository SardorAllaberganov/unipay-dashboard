import { cn } from '@/lib/utils';
import { formatMoney, formatUZS } from '@/lib/format';
import type { Money } from '@/types/domain';

interface Props {
  value: Money | number;
  mono?: boolean;
  muted?: boolean;
  className?: string;
}

export function AmountDisplay({ value, mono, muted, className }: Props) {
  const text = typeof value === 'number' ? formatUZS(value) : formatMoney(value);
  return (
    <span
      className={cn(
        'tabular',
        mono && 'mono',
        muted && 'text-muted-foreground',
        className
      )}
    >
      {text}
    </span>
  );
}
