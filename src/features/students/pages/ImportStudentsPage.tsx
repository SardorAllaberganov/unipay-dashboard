import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { BackLink } from '@/components/shared/BackLink';
import { PageHeader } from '@/components/layout/PageHeader';
import { cn } from '@/lib/utils';
import type { ImportRow } from '@/types/domain';
import { useImportSession } from '../hooks/useImportSession';
import { Step1Download } from '../components/import/Step1Download';
import { Step2Upload } from '../components/import/Step2Upload';
import { Step3Review } from '../components/import/Step3Review';
import { Step4Confirm } from '../components/import/Step4Confirm';

type StepKey = 'download' | 'upload' | 'review' | 'confirm';
const STEPS: StepKey[] = ['download', 'upload', 'review', 'confirm'];

export default function ImportStudentsPage() {
  const { t } = useTranslation();
  const [step, setStep] = useState<StepKey>('download');
  const importSession = useImportSession();
  const [committed, setCommitted] = useState(false);

  const handleParse = async (file: File) => {
    await importSession.parse.mutateAsync(file);
    setStep('review');
  };

  const handlePatchRow = async (index: number, patch: Partial<ImportRow['raw']>) => {
    await importSession.patchRow.mutateAsync({ index, patch });
  };

  const handleCommit = async (reason?: string) => {
    await importSession.commit.mutateAsync(reason);
    setCommitted(true);
  };

  const downloadErrorReport = async () => {
    const data = await importSession.errorReport.mutateAsync();
    // Build a small xlsx with the error rows + their first error message per row.
    const xlsx = await import('xlsx');
    const wb = xlsx.utils.book_new();
    const header = [
      'index', 'studentId', 'firstName', 'lastName', 'departmentId',
      'year', 'educationType', 'enrollmentDate', 'amount', 'dueDate',
      'errors',
    ];
    const aoa: (string | number)[][] = [header];
    for (const row of data.rows) {
      aoa.push([
        row.index + 1,
        row.raw.studentId ?? '',
        row.raw.firstName ?? '',
        row.raw.lastName ?? '',
        row.raw.departmentId ?? '',
        row.raw.year ?? '',
        row.raw.educationType ?? '',
        row.raw.enrollmentDate ?? '',
        row.raw.amount ?? '',
        row.raw.dueDate ?? '',
        row.errors.map((e) => `${e.field}: ${e.code}`).join('; '),
      ]);
    }
    const sheet = xlsx.utils.aoa_to_sheet(aoa);
    xlsx.utils.book_append_sheet(wb, sheet, 'Errors');
    const out = xlsx.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
    const blob = new Blob([out], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'unipay-import-errors.xlsx';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-8">
      <BackLink to="/students" pluralName={t('students.import.backPlural')} />
      <PageHeader title={t('students.import.title')} />

      <StepIndicator current={step} />

      {step === 'download' ? (
        <Step1Download onNext={() => setStep('upload')} />
      ) : null}

      {step === 'upload' ? (
        <Step2Upload
          onParse={handleParse}
          onBack={() => setStep('download')}
          parsing={importSession.parse.isPending}
          errorCode={
            importSession.parse.isError ? (importSession.parse.error as Error).message : undefined
          }
        />
      ) : null}

      {step === 'review' ? (
        <Step3Review
          rows={importSession.rows}
          okCount={importSession.okCount}
          errorCount={importSession.errorCount}
          onPatch={handlePatchRow}
          onContinue={() => setStep('confirm')}
          onBack={() => {
            importSession.reset();
            setStep('upload');
          }}
          onDownloadErrors={downloadErrorReport}
        />
      ) : null}

      {step === 'confirm' ? (
        <Step4Confirm
          totalRows={importSession.session?.totalRows ?? 0}
          okCount={importSession.okCount}
          committing={importSession.commit.isPending}
          committed={committed}
          onCommit={handleCommit}
          onBack={() => setStep('review')}
        />
      ) : null}
    </div>
  );
}

// ---- step indicator ----

function StepIndicator({ current }: { current: StepKey }) {
  const { t } = useTranslation();
  const currentIdx = STEPS.indexOf(current);
  return (
    <ol className="flex flex-wrap items-center gap-3 text-sm" aria-label={t('students.import.title')}>
      {STEPS.map((key, i) => {
        const done = i < currentIdx;
        const active = key === current;
        return (
          <li
            key={key}
            className={cn(
              'inline-flex items-center gap-2 rounded-md px-2.5 py-1',
              active && 'bg-brand-50 text-brand-700',
              done && 'text-success-700',
              !active && !done && 'text-muted-foreground',
            )}
            aria-current={active ? 'step' : undefined}
          >
            <span
              className={cn(
                'inline-flex size-6 items-center justify-center rounded-full border text-xs font-medium tabular',
                done
                  ? 'border-success-600 bg-success-50 text-success-700'
                  : active
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-border text-muted-foreground',
              )}
              aria-hidden
            >
              {done ? <Check className="size-3.5" aria-hidden /> : i + 1}
            </span>
            <span className="font-medium">{t(`students.import.steps.${key}`)}</span>
          </li>
        );
      })}
    </ol>
  );
}
