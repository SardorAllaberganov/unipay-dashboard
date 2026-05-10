import { AlertCircle, WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Shared per-panel state renderings. The 6 states (§0.8) are inline in each panel —
// these primitives ensure visual consistency across loading / error / empty / offline.

interface ErrorSlateProps {
  onRetry?: () => void;
  className?: string;
  title?: string;
  body?: string;
}

export function PanelErrorState({ onRetry, className, title, body }: ErrorSlateProps) {
  const { t } = useTranslation();
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border bg-card/40 p-6 text-center',
        className,
      )}
    >
      <AlertCircle className="size-8 text-danger-600" aria-hidden />
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">
          {title ?? t('common.states.errorTitle')}
        </p>
        <p className="text-sm text-muted-foreground">{body ?? t('common.states.errorBody')}</p>
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          {t('common.actions.retry')}
        </Button>
      ) : null}
    </div>
  );
}

interface EmptySlateProps {
  className?: string;
  body?: string;
}

export function PanelEmptyState({ className, body }: EmptySlateProps) {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-card/40 p-6 text-center',
        className,
      )}
    >
      <p className="text-sm text-muted-foreground">
        {body ?? t('dashboard.empty.noData')}
      </p>
    </div>
  );
}

interface OfflineSlateProps {
  className?: string;
}

export function PanelOfflineState({ className }: OfflineSlateProps) {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-card/40 p-6 text-center',
        className,
      )}
    >
      <WifiOff className="size-6 text-muted-foreground" aria-hidden />
      <p className="text-sm text-muted-foreground">
        {t('common.states.offlineNoCache')}
      </p>
    </div>
  );
}

interface OfflineNoteProps {
  className?: string;
}

export function PanelOfflineNote({ className }: OfflineNoteProps) {
  const { t } = useTranslation();
  return (
    <p
      role="status"
      className={cn(
        'inline-flex items-center gap-1.5 text-sm text-muted-foreground',
        className,
      )}
    >
      <WifiOff className="size-3.5" aria-hidden />
      {t('common.states.offlineNote')}
    </p>
  );
}

interface PartialNoteProps {
  shown: number;
  total: number;
  className?: string;
}

export function PanelPartialNote({ shown, total, className }: PartialNoteProps) {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex items-center gap-2 rounded-md border border-warning-600/30 bg-warning-50 px-3 py-2 text-sm text-warning-700 dark:bg-warning-700/10 dark:text-warning-400',
        className,
      )}
    >
      <AlertCircle className="size-4 shrink-0" aria-hidden />
      <span>{t('common.states.partialNote', { shown, total })}</span>
    </div>
  );
}

interface SlowNoteProps {
  className?: string;
}

export function PanelSlowNote({ className }: SlowNoteProps) {
  const { t } = useTranslation();
  return (
    <p
      role="status"
      aria-live="polite"
      className={cn('text-sm text-muted-foreground', className)}
    >
      {t('common.states.slowNote')}
    </p>
  );
}

// Skeleton helpers — same height as the data they replace so the layout doesn't reflow.
export function KpiCardSkeleton() {
  return (
    <div className="flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-5">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="mt-auto h-8 w-full" />
    </div>
  );
}

export function ChartSkeleton({ heightClassName = 'h-64' }: { heightClassName?: string }) {
  return <Skeleton className={cn('w-full rounded-md', heightClassName)} />;
}

export function ListRowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <Skeleton className="size-9 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-2/5" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      <Skeleton className="h-3.5 w-16" />
    </div>
  );
}
