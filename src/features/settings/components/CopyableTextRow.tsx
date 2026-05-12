// Canonical tap-to-copy pattern per LESSON 2026-05-11. Used for API key plaintext,
// recovery codes, signing secret reveal. Keep in sync with TransactionIdCopy /
// PayoutIdCopy / BankAccountFormParts.CopyableRow.
import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface Props {
  value: string;
  /** Optional inline label rendered before the value. */
  label?: string;
  /** sr-only verb prepended to the aria-label. Defaults to "Copy". */
  ariaVerb?: string;
  className?: string;
  /** Render the value in a `font-mono tabular` style — true by default. */
  mono?: boolean;
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback for non-secure contexts / older WebViews.
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'absolute';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function CopyableTextRow({
  value,
  label,
  ariaVerb,
  className,
  mono = true,
}: Props) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const onClick = async () => {
    const ok = await copyToClipboard(value);
    if (!ok) {
      toast.error(t('common.actions.copyFailed'));
      return;
    }
    if (typeof navigator.vibrate === 'function') navigator.vibrate(10);
    toast.success(t('common.actions.copied'));
    setCopied(true);
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${ariaVerb ?? t('common.actions.copy')}: ${label ?? value}`}
      className={cn(
        'group flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        {label ? (
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        ) : null}
        <p
          className={cn(
            'truncate text-sm text-foreground',
            mono && 'font-mono tabular',
          )}
        >
          {value}
        </p>
      </div>
      {copied ? (
        <Check className="size-4 shrink-0 text-success-700" aria-hidden />
      ) : (
        <Copy
          className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
          aria-hidden
        />
      )}
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? t('common.actions.copied') : ''}
      </span>
    </button>
  );
}
