// Tap-to-copy transaction ID. Truncated middle with horizontal ellipsis. Pattern per
// LESSONS 2026-05-11 (canonical tap-to-copy: button + clipboard fallback + haptic +
// icon swap + sr-only live region + toast). `font-mono text-xs` allowed §0.2 (mono-id class).
import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Props {
  value: string;
  // Number of leading characters to keep before the ellipsis. Default 4.
  leading?: number;
  // Number of trailing characters to keep after the ellipsis. Default 4.
  trailing?: number;
  className?: string;
}

function truncateMiddle(value: string, leading: number, trailing: number): string {
  if (value.length <= leading + trailing + 1) return value;
  return `${value.slice(0, leading)}…${value.slice(-trailing)}`;
}

export function TransactionIdCopy({
  value,
  leading = 4,
  trailing = 4,
  className,
}: Props) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const onCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const el = document.createElement('textarea');
        el.value = value;
        el.setAttribute('readonly', '');
        el.style.position = 'absolute';
        el.style.left = '-9999px';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      setCopied(true);
      if (typeof navigator.vibrate === 'function') navigator.vibrate(10);
      toast.success(t('common.actions.copied'));
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error(t('errors.generic'));
    }
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={`${t('common.actions.copy')}: ${value}`}
      className={cn(
        'group inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 text-xs font-mono text-foreground transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      <span>{truncateMiddle(value, leading, trailing)}</span>
      <span aria-hidden className="text-muted-foreground transition-colors group-hover:text-foreground">
        {copied ? (
          <Check className="size-3 text-success-700" />
        ) : (
          <Copy className="size-3" />
        )}
      </span>
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? t('common.actions.copied') : ''}
      </span>
    </button>
  );
}
