import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { WriteButton } from '@/components/unipay/WriteButton';
import { Money } from '@/components/unipay/Money';
import { useNetworkState } from '@/hooks/useNetworkState';
import { useUnpaidStudents } from '../hooks/useUnpaidStudents';
import { useBulkRemindUnpaid } from '../hooks/useBulkRemindUnpaid';
import {
  PanelEmptyState,
  PanelErrorState,
  PanelOfflineNote,
  PanelOfflineState,
  PanelPartialNote,
} from '@/components/shared/PanelStates';

export function UnpaidStudents() {
  const { t } = useTranslation();
  const online = useNetworkState();
  const query = useUnpaidStudents(10);
  const bulkRemind = useBulkRemindUnpaid();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const students = query.data?.items ?? [];
  const meta = query.data?._meta;
  const studentIds = students.map((s) => s.id);

  const handleConfirm = (reason?: string) => {
    if (!reason || reason.trim().length < 20) return;
    bulkRemind.mutate(
      { studentIds, reason: reason.trim() },
      {
        onSuccess: (data) => {
          setConfirmOpen(false);
          toast.success(
            t('dashboard.unpaid.bulkRemindSuccess', { count: data.count }),
          );
        },
        onError: () => {
          toast.error(t('errors.generic'));
        },
      },
    );
  };

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>{t('dashboard.unpaid.title')}</CardTitle>
      </CardHeader>

      <CardContent className="flex-1 space-y-2">
        {!online && !query.isError ? <PanelOfflineNote /> : null}

        {query.isPending ? (
          <ul className="divide-y divide-border">
            {[0, 1, 2, 3, 4].map((i) => (
              <li key={i} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-2/5" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <Skeleton className="h-3.5 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </li>
            ))}
          </ul>
        ) : query.isError ? (
          !online ? (
            <PanelOfflineState />
          ) : (
            <PanelErrorState onRetry={() => query.refetch()} />
          )
        ) : students.length === 0 ? (
          <PanelEmptyState body={t('dashboard.empty.noData')} />
        ) : (
          <>
            {meta?.partial ? (
              <PanelPartialNote
                shown={meta.shown ?? students.length}
                total={meta.total ?? students.length}
              />
            ) : null}
            <ul className="divide-y divide-border">
              {students.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">
                    {s.studentName}
                  </div>
                  <div className="mt-0.5 truncate text-sm text-muted-foreground">
                    {s.departmentName}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-0.5">
                  <Money
                    value={{ amount: BigInt(s.amount), currency: s.currency }}
                  />
                  <span className="text-sm tabular text-destructive">
                    {t('dashboard.unpaid.daysOverdue', { count: s.daysOverdue })}
                  </span>
                </div>
              </li>
            ))}
            </ul>
          </>
        )}
      </CardContent>

      <CardFooter className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/payments/pending?tab=overdue"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-300"
        >
          {t('dashboard.unpaid.viewAll')}
          <ArrowRight className="size-4" aria-hidden />
        </Link>

        <WriteButton
          variant="destructive"
          size="sm"
          disabled={students.length === 0 || query.isPending}
          onClick={() => setConfirmOpen(true)}
        >
          {t('dashboard.unpaid.bulkRemind')}
        </WriteButton>
      </CardFooter>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t('dashboard.unpaid.bulkRemindTitle', { count: students.length })}
        description={t('dashboard.unpaid.bulkRemindBody')}
        confirmLabel={t('dashboard.unpaid.bulkRemindConfirm')}
        destructive
        requireReason
        minReasonLength={20}
        reasonLabel={t('dashboard.unpaid.bulkRemindReasonLabel')}
        reasonPlaceholder={t('dashboard.unpaid.bulkRemindReasonPlaceholder')}
        loading={bulkRemind.isPending}
        onConfirm={handleConfirm}
      />
    </Card>
  );
}
