import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WriteButton } from '@/components/unipay/WriteButton';
import {
  PanelEmptyState,
  PanelErrorState,
  PanelOfflineNote,
  PanelOfflineState,
  PanelPartialNote,
  ListRowSkeleton,
} from '@/components/shared/PanelStates';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useNetworkState } from '@/hooks/useNetworkState';
import { formatDateTime } from '@/lib/format';
import { Download, FileText, Loader2, Trash2 } from 'lucide-react';
import { ExpiryCountdown } from './ExpiryCountdown';
import { useDeleteExport, useExportsList } from '../hooks/useExportsList';
import type { ExportJobSnapshot } from '../api';

export function RecentExportsList() {
  const { t } = useTranslation();
  const online = useNetworkState();
  const list = useExportsList();
  const del = useDeleteExport();
  const [confirmTarget, setConfirmTarget] = useState<ExportJobSnapshot | null>(null);

  const body = (() => {
    if (list.isPending) {
      return (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <ListRowSkeleton key={i} />
          ))}
        </div>
      );
    }
    if (list.isError) {
      if (!online) return <PanelOfflineState />;
      return <PanelErrorState onRetry={() => list.refetch()} />;
    }
    const items = list.data?.items ?? [];
    if (items.length === 0) {
      return (
        <PanelEmptyState body={t('reports.export.recent.emptyBody')} />
      );
    }
    return (
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="flex min-w-0 items-start gap-3">
              <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
                <FileText className="size-4" aria-hidden />
              </div>
              <div className="min-w-0 space-y-1">
                <p className="truncate text-sm font-medium tabular">{item.fileName}</p>
                <p className="text-sm text-muted-foreground">
                  <span className="tabular">{formatDateTime(item.createdAt)}</span>
                  <span aria-hidden> · </span>
                  <span>
                    {t(`reports.export.form.dataType.${item.dataType}`)}
                  </span>
                  <span aria-hidden> · </span>
                  <span className="tabular">
                    {t('reports.export.recent.rowsLabel', { count: item.rows })}
                  </span>
                </p>
                {item.status === 'processing' ? (
                  <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                    {t('reports.export.progress.preparing', {
                      seconds: item.etaSeconds ?? 3,
                    })}
                  </p>
                ) : item.status === 'ready' ? (
                  <ExpiryCountdown expiresAt={item.expiresAt} />
                ) : (
                  <p className="text-sm text-destructive">
                    {t('reports.export.progress.failed')}
                  </p>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {item.status === 'ready' && item.url ? (
                <Button asChild variant="outline" size="sm">
                  <a href={item.url} download={item.fileName}>
                    <Download className="mr-2 size-4" aria-hidden />
                    {t('reports.export.recent.downloadCta')}
                  </a>
                </Button>
              ) : null}
              <WriteButton
                variant="destructive"
                size="sm"
                onClick={() => setConfirmTarget(item)}
                aria-label={t('reports.export.recent.deleteCta')}
              >
                <Trash2 className="mr-2 size-4" aria-hidden />
                {t('reports.export.recent.deleteCta')}
              </WriteButton>
            </div>
          </li>
        ))}
      </ul>
    );
  })();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('reports.export.recent.title')}</CardTitle>
        <CardDescription>{t('reports.export.recent.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!online && !list.isError ? <PanelOfflineNote /> : null}
        {list.data?._meta?.partial ? (
          <PanelPartialNote
            shown={list.data._meta.shown ?? 0}
            total={list.data._meta.total ?? 0}
          />
        ) : null}
        {body}
      </CardContent>

      <ConfirmDialog
        open={confirmTarget !== null}
        onOpenChange={(o) => {
          if (!o) setConfirmTarget(null);
        }}
        title={t('reports.export.recent.deleteTitle')}
        description={t('reports.export.recent.deleteBody', {
          name: confirmTarget?.fileName ?? '',
        })}
        confirmLabel={t('reports.export.recent.deleteConfirm')}
        destructive
        requireReason
        minReasonLength={20}
        reasonPlaceholder={t('reports.export.recent.deleteReasonHint')}
        onConfirm={async () => {
          if (!confirmTarget) return;
          try {
            await del.mutateAsync(confirmTarget.id);
            toast.success(t('reports.export.toasts.deleteSuccess'));
          } catch {
            toast.error(t('reports.export.toasts.deleteError'));
          } finally {
            setConfirmTarget(null);
          }
        }}
      />
    </Card>
  );
}
