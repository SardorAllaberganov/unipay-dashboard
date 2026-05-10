import { format, formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale/ru';
import type { Money } from '@/types/domain';

export const TASHKENT_TZ = 'Asia/Tashkent';

const numberFormatter = new Intl.NumberFormat('ru-RU');
const compactFormatter = new Intl.NumberFormat('ru-RU', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

export const formatNumber = (n: number) => numberFormatter.format(n);
export const formatCompact = (n: number) => compactFormatter.format(n);

// Money is stored in minor units (tiyins/cents). Divide by 100 at display time.
function divMinor(amount: bigint): { whole: bigint; cents: number } {
  const whole = amount / 100n;
  const cents = Number(amount < 0n ? -amount % 100n : amount % 100n);
  return { whole, cents };
}

export function formatMoney(money: Money | { amount: number; currency: 'UZS' | 'USD' }): string {
  const isBigInt = typeof money.amount === 'bigint';
  const negative = isBigInt ? (money.amount as bigint) < 0n : (money.amount as number) < 0;

  if (money.currency === 'UZS') {
    const value = isBigInt
      ? Number(divMinor(money.amount as bigint).whole)
      : Math.trunc(money.amount as number);
    return `${negative ? '−' : ''}${numberFormatter.format(Math.abs(value))} UZS`;
  }
  // USD — render with two decimals.
  if (isBigInt) {
    const { whole, cents } = divMinor(money.amount as bigint);
    return `${negative ? '−' : ''}${numberFormatter.format(Math.abs(Number(whole)))},${cents.toString().padStart(2, '0')} USD`;
  }
  const value = money.amount as number;
  return `${new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)} USD`;
}

export const formatUZS = (amount: number) => `${numberFormatter.format(Math.round(amount))} UZS`;

const toDate = (d: Date | string) => (typeof d === 'string' ? new Date(d) : d);

export const formatDate = (d: Date | string) => format(toDate(d), 'dd.MM.yyyy');
export const formatDateTime = (d: Date | string) => format(toDate(d), 'dd.MM.yyyy HH:mm');
export const formatTime = (d: Date | string) => format(toDate(d), 'HH:mm');
export const formatRelative = (d: Date | string) =>
  formatDistanceToNow(toDate(d), { addSuffix: true, locale: ru });

export const maskAccount = (n: string) => (!n || n.length < 4 ? n : `••••${n.slice(-4)}`);

export const formatPercent = (n: number, fractionDigits = 1) =>
  `${n.toFixed(fractionDigits).replace('.', ',')}%`;

export const formatDelta = (n: number, fractionDigits = 1) => {
  const sign = n > 0 ? '+' : n < 0 ? '−' : '';
  return `${sign}${Math.abs(n).toFixed(fractionDigits).replace('.', ',')}%`;
};
