// STYLE_DISCIPLINE.md §0.9 — bank account numbers are always masked. Never reconstruct full PAN.
import { cn } from '@/lib/utils';
import { maskAccount } from '@/lib/format';

interface Props {
  value: string;
  className?: string;
}

export function MaskedAccount({ value, className }: Props) {
  return (
    <span className={cn('mono tabular', className)} aria-label={`Account ending in ${value.slice(-4)}`}>
      {maskAccount(value)}
    </span>
  );
}
