// Failure-code cell primitive. Renders an AlertTriangle + localized title in destructive tone,
// with the full message in a Tooltip. Per .claude/rules/error-ux.md the title/body come from the
// error-codes table (mirrored in `src/lib/errorCodes.ts`). `text-xs` allowed §0.2 (chip body
// category) for the failure code mono label.
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { lookupErrorCode } from '@/lib/errorCodes';
import type { FailureCode } from '@/types/domain';

interface Props {
  code: FailureCode | undefined;
  className?: string;
}

export function ErrorCell({ code, className }: Props) {
  const { t } = useTranslation();
  const entry = lookupErrorCode(code);
  if (!entry) {
    return (
      <span className={className}>
        <span className="inline-flex items-center gap-1 text-sm text-destructive">
          <AlertTriangle className="size-3.5" aria-hidden />
          {t('payments.detail.failureBadge')}
        </span>
      </span>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={`inline-flex items-center gap-1 text-sm text-destructive ${className ?? ''}`}
        >
          <AlertTriangle className="size-3.5" aria-hidden />
          {t(entry.titleKey)}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-medium">{t(entry.titleKey)}</p>
        <p className="mt-1 text-sm">{t(entry.bodyKey)}</p>
        <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
          {t('payments.detail.failureTooltipPrefix')}: {entry.code}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
