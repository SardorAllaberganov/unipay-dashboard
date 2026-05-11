import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, CheckCircle2, Download } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable, type DataTableState } from '@/components/shared/DataTable';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WriteButton } from '@/components/unipay/WriteButton';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { ImportRow, ImportRowError } from '@/types/domain';

interface Props {
  rows: ImportRow[];
  okCount: number;
  errorCount: number;
  onPatch: (index: number, patch: Partial<ImportRow['raw']>) => Promise<void>;
  onContinue: () => void;
  onBack: () => void;
  onDownloadErrors: () => Promise<void>;
  isLoading?: boolean;
  isError?: boolean;
}

type EditableField = keyof ImportRow['raw'];

const EDITABLE_FIELDS: EditableField[] = [
  'studentId', 'firstName', 'lastName', 'departmentId', 'year',
  'educationType', 'enrollmentDate', 'amount', 'dueDate',
];

function fieldErrorCode(errors: ImportRowError[], field: EditableField): string | null {
  return errors.find((e) => e.field === field)?.code ?? null;
}

export function Step3Review({
  rows,
  okCount,
  errorCount,
  onPatch,
  onContinue,
  onBack,
  onDownloadErrors,
  isLoading,
  isError,
}: Props) {
  const { t } = useTranslation();
  const [reportLoading, setReportLoading] = useState(false);

  const state: DataTableState = useMemo(() => {
    if (isLoading) return 'loading';
    if (isError) return 'error';
    if (rows.length === 0) return 'empty';
    return 'data';
  }, [isLoading, isError, rows.length]);

  const columns = useMemo<ColumnDef<ImportRow, unknown>[]>(
    () => [
      {
        id: 'index',
        meta: { headerClassName: 'w-[1%]', cellClassName: 'text-right tabular' },
        header: () => t('students.import.step3.columns.index'),
        cell: ({ row }) => <span className="tabular">{row.original.index + 1}</span>,
      },
      {
        id: 'status',
        meta: { headerClassName: 'w-[1%]' },
        header: () => t('students.import.step3.columns.status'),
        cell: ({ row }) =>
          row.original.errors.length === 0 ? (
            <span className="inline-flex items-center gap-1 text-success-700">
              <CheckCircle2 className="size-4" aria-hidden />
              <span className="text-sm">{t('students.import.step3.rowOk')}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-danger-700">
              <AlertCircle className="size-4" aria-hidden />
              <span className="text-sm">
                {t('students.import.step3.rowError')} ({row.original.errors.length})
              </span>
            </span>
          ),
      },
      ...EDITABLE_FIELDS.map(
        (field): ColumnDef<ImportRow, unknown> => ({
          id: field,
          header: () => t(`students.import.step3.columns.${field}`),
          cell: ({ row }) => (
            <EditableCell
              row={row.original}
              field={field}
              onPatch={(value) => onPatch(row.original.index, { [field]: value })}
              fieldErrorCode={fieldErrorCode(row.original.errors, field)}
            />
          ),
        }),
      ),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, onPatch],
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">{t('students.import.step3.title')}</h2>
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="inline-flex items-center gap-1 text-success-700">
                <CheckCircle2 className="size-4" aria-hidden />
                {t('students.import.step3.summaryOk', { count: okCount })}
              </span>
              {errorCount > 0 ? (
                <span className="inline-flex items-center gap-1 text-danger-700">
                  <AlertCircle className="size-4" aria-hidden />
                  {t('students.import.step3.summaryErrors', { count: errorCount })}
                </span>
              ) : null}
            </div>
          </div>
          {errorCount > 0 ? (
            <Button
              type="button"
              variant="outline"
              disabled={reportLoading}
              onClick={async () => {
                setReportLoading(true);
                try {
                  await onDownloadErrors();
                } finally {
                  setReportLoading(false);
                }
              }}
            >
              <Download className="mr-1.5 size-4" aria-hidden />
              {t('students.import.step3.downloadReport')}
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <DataTable<ImportRow>
        columns={columns}
        data={rows}
        state={state}
        rowKey={(row) => `imp-${row.index}`}
        rowClassName={(row) =>
          row.errors.length > 0
            ? 'before:absolute before:inset-y-0 before:left-0 before:w-[2px] before:bg-danger-600 before:content-[""]'
            : undefined
        }
      />

      <div className="flex flex-wrap justify-between gap-2">
        <Button type="button" variant="ghost" onClick={onBack}>
          {t('students.import.step2.cancel')}
        </Button>
        <WriteButton type="button" disabled={errorCount > 0} onClick={onContinue}>
          {errorCount > 0
            ? t('students.import.step3.continueDisabled')
            : t('students.import.step3.continue')}
        </WriteButton>
      </div>
    </div>
  );
}

// ---- inline-edit cell ----

interface EditableCellProps {
  row: ImportRow;
  field: EditableField;
  onPatch: (value: string) => Promise<void>;
  fieldErrorCode: string | null;
}

function EditableCell({ row, field, onPatch, fieldErrorCode }: EditableCellProps) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>(row.raw[field] ?? '');
  const [saving, setSaving] = useState(false);

  const hasError = !!fieldErrorCode;
  const displayValue = row.raw[field] ?? '';

  const commit = async () => {
    if (draft === (row.raw[field] ?? '')) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onPatch(draft);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <Input
        autoFocus
        value={draft}
        disabled={saving}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => void commit()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            void commit();
          } else if (e.key === 'Escape') {
            setDraft(displayValue);
            setEditing(false);
          }
        }}
        className="h-9 text-sm"
      />
    );
  }

  return (
    <div className="space-y-0.5">
      <button
        type="button"
        onClick={() => {
          setDraft(displayValue);
          setEditing(true);
        }}
        className={cn(
          'inline-flex h-9 w-full min-w-0 items-center rounded-md px-2 text-left text-sm hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-1',
          hasError && 'bg-destructive/10',
        )}
      >
        <span className="truncate">{displayValue || <span className="text-muted-foreground">—</span>}</span>
      </button>
      {hasError ? (
        <p className="text-sm text-danger-700">
          {t(`students.import.step3.fieldErrors.${fieldErrorCode}`, fieldErrorCode ?? '')}
        </p>
      ) : null}
    </div>
  );
}
