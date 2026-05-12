// Panel that renders a list of one-time-view codes (2FA recovery / API key
// plaintext) with bulk copy. Used inside Enable2FaWizard, GenerateApiKeyDialog,
// regenerate flows.
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface Props {
  /** Either a list of codes (renders as a grid) or a single plaintext token. */
  codes?: string[];
  plaintext?: string;
  description: string;
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
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

export function CopyOrLoseItPanel({ codes, plaintext, description }: Props) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  const allText = plaintext ?? (codes ?? []).join('\n');

  const onCopy = async () => {
    const ok = await copyToClipboard(allText);
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
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-lg border border-warning-600/30 bg-warning-50 p-3 text-sm text-warning-700 dark:bg-warning-700/10 dark:text-warning-400">
        <AlertTriangle className="size-4 shrink-0" aria-hidden />
        <p>{description}</p>
      </div>

      {plaintext ? (
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
          <p className="break-all font-mono text-sm tabular text-foreground">
            {plaintext}
          </p>
        </div>
      ) : null}

      {codes ? (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {codes.map((code) => (
            <li
              key={code}
              className="rounded-md border border-border bg-muted/30 px-2.5 py-1.5 text-center font-mono text-sm tabular text-foreground"
            >
              {code}
            </li>
          ))}
        </ul>
      ) : null}

      <Button onClick={onCopy} className="w-full" variant={copied ? 'outline' : 'default'}>
        {copied ? (
          <>
            <Check className="size-4" aria-hidden />
            {t('settings.security.twoFa.copiedAndSaved')}
          </>
        ) : (
          <>
            <Copy className="size-4" aria-hidden />
            {t('settings.security.twoFa.copyAndSaved')}
          </>
        )}
      </Button>
    </div>
  );
}
