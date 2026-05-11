import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Building2, Download, X, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WriteButton } from '@/components/unipay/WriteButton';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  useBulkDeactivate,
  useBulkExport,
  useBulkRemind,
} from '../../hooks/useStudentMutations';

interface Props {
  selectedIds: string[];
  onChangeDept: () => void;
  onClear: () => void;
}

export function BulkActionBar({ selectedIds, onChangeDept, onClear }: Props) {
  const { t } = useTranslation();
  const count = selectedIds.length;
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  const remind = useBulkRemind();
  const exportMut = useBulkExport();
  const deactivate = useBulkDeactivate();

  if (count === 0) return null;

  return (
    <>
      <div
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card px-4 py-3 md:left-[var(--sidebar-width,4rem)] md:px-6"
        role="region"
        aria-label={t('students.bulk.selectedCount', { count })}
      >
        <div className="flex flex-wrap items-center gap-2 md:flex-nowrap">
          <div className="flex flex-1 items-center gap-2 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={onClear}
              aria-label={t('common.actions.cancel')}
              className="size-9 shrink-0 p-0"
            >
              <X className="size-4" aria-hidden />
            </Button>
            <p className="truncate text-sm font-medium text-foreground tabular">
              {t('students.bulk.selectedCount', { count })}
            </p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:flex-nowrap">
            <WriteButton
              type="button"
              variant="outline"
              onClick={() => remind.mutate({ studentIds: selectedIds })}
              disabled={remind.isPending}
              className="flex-1 md:flex-none"
            >
              <Bell className="mr-1.5 size-4" aria-hidden />
              {t('students.bulk.remind')}
            </WriteButton>
            <WriteButton
              type="button"
              variant="outline"
              onClick={() => exportMut.mutate({ studentIds: selectedIds })}
              disabled={exportMut.isPending}
              className="flex-1 md:flex-none"
            >
              <Download className="mr-1.5 size-4" aria-hidden />
              {t('students.bulk.export')}
            </WriteButton>
            <WriteButton
              type="button"
              variant="outline"
              onClick={onChangeDept}
              className="flex-1 md:flex-none"
            >
              <Building2 className="mr-1.5 size-4" aria-hidden />
              {t('students.bulk.changeDept')}
            </WriteButton>
            <WriteButton
              type="button"
              variant="destructive"
              onClick={() => setConfirmDeactivate(true)}
              disabled={deactivate.isPending}
              className="flex-1 md:flex-none"
            >
              <XCircle className="mr-1.5 size-4" aria-hidden />
              {t('students.bulk.deactivate')}
            </WriteButton>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDeactivate}
        onOpenChange={setConfirmDeactivate}
        title={t('students.bulk.deactivateTitle')}
        description={t('students.bulk.deactivateBody', { count })}
        confirmLabel={t('students.bulk.deactivateConfirm')}
        destructive
        requireReason
        minReasonLength={20}
        reasonPlaceholder={t('students.bulk.reasonPlaceholder')}
        onConfirm={async (reason) => {
          await deactivate.mutateAsync({ studentIds: selectedIds, reason: reason ?? '' });
          onClear();
        }}
      />
    </>
  );
}
