import { useState } from 'react';
import { AlertCircle, Check, Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { SystemStateLayout } from './SystemStateLayout';

interface Props {
  referenceId: string | null;
  onRetry?: () => void;
  fullBleed?: boolean;
}

export function ServerErrorState({ referenceId, onRetry, fullBleed }: Props) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const copyId = async () => {
    if (!referenceId) return;
    try {
      await navigator.clipboard.writeText(referenceId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <SystemStateLayout
      variant={fullBleed ? 'full-bleed' : 'in-shell'}
      icon={AlertCircle}
      iconTone="danger"
      title={t('system.serverError.title')}
      body={t('system.serverError.body')}
      primary={{ label: t('system.serverError.primary'), onClick: onRetry }}
      footer={
        referenceId ? (
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm text-muted-foreground">
              {t('system.serverError.referenceLabel')}:
            </span>
            <code className="mono rounded bg-muted px-2 py-0.5 text-sm">{referenceId}</code>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={copyId}
              aria-label={t('common.actions.copy')}
            >
              {copied ? (
                <Check className="size-3.5 text-success-600" aria-hidden />
              ) : (
                <Copy className="size-3.5" aria-hidden />
              )}
            </Button>
          </div>
        ) : null
      }
    />
  );
}
