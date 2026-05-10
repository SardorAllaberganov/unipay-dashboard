// STYLE_DISCIPLINE.md §0.1 — money values always use tabular numerals; negatives go red.
import type { Money as MoneyType } from '@/types/domain';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';

interface Props {
  value: MoneyType;
  mono?: boolean;
  muted?: boolean;
  className?: string;
}

export function Money({ value, mono = true, muted, className }: Props) {
  const isNegative = typeof value.amount === 'bigint' ? value.amount < 0n : value.amount < 0;
  return (
    <span
      className={cn(
        'tabular',
        mono && 'font-mono',
        isNegative && 'text-danger-600',
        muted && !isNegative && 'text-muted-foreground',
        className
      )}
    >
      {formatMoney(value)}
    </span>
  );
}
