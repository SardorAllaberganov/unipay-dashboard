import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  expiresAt: string;
  className?: string;
}

const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

/**
 * Localized "истекает через N (дн./час.)" badge. Re-renders once per minute so
 * the relative time stays accurate while the page sits open. Falls back to
 * "истёк" when the timestamp is past.
 */
export function ExpiryCountdown({ expiresAt, className }: Props) {
  const { t } = useTranslation();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const remaining = new Date(expiresAt).getTime() - now;
  const expired = remaining <= 0;

  const label = (() => {
    if (expired) return t('reports.export.expiry.expired');
    if (remaining >= DAY_MS) {
      const days = Math.floor(remaining / DAY_MS);
      return t('reports.export.expiry.days', { count: days });
    }
    const hours = Math.max(1, Math.ceil(remaining / HOUR_MS));
    return t('reports.export.expiry.hours', { count: hours });
  })();

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-sm',
        expired ? 'text-destructive' : 'text-muted-foreground',
        className,
      )}
    >
      <Clock className="size-3.5" aria-hidden />
      <span>{label}</span>
    </span>
  );
}
