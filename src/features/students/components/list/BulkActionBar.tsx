import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Building2, Download, XCircle } from 'lucide-react';
import { WriteButton } from '@/components/unipay/WriteButton';
import { BulkActionBar as SharedBulkActionBar } from '@/components/shared/BulkActionBar';
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

  return (
    <>
      <SharedBulkActionBar
        count={count}
        onClear={onClear}
        label={t('students.bulk.selectedCount', { count })}
      >
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
      </SharedBulkActionBar>

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
