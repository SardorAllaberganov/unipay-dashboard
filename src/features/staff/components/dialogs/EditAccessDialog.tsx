import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Check, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResponsiveSheet } from '@/components/shared/ResponsiveSheet';
import { WriteButton } from '@/components/unipay/WriteButton';
import { useDepartments } from '@/features/organization/hooks/useDepartments';
import { cn } from '@/lib/utils';
import type { StaffMember } from '@/types/domain';
import { useUpdateStaffAccess } from '../../hooks/useStaffMutations';
import { DepartmentTreePicker } from '../shared/DepartmentTreePicker';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: StaffMember;
}

type AccessMode = 'all' | 'specific';

export function EditAccessDialog({ open, onOpenChange, staff }: Props) {
  const { t } = useTranslation();
  const mutation = useUpdateStaffAccess();
  const { data: depts } = useDepartments();
  const totalDepts = depts?.items?.length ?? 0;

  const [mode, setMode] = useState<AccessMode>(
    staff.departmentIds.length === 0 ? 'all' : 'specific'
  );
  const [selected, setSelected] = useState<string[]>(staff.departmentIds);

  useEffect(() => {
    if (open) {
      setMode(staff.departmentIds.length === 0 ? 'all' : 'specific');
      setSelected(staff.departmentIds);
    }
  }, [open, staff.departmentIds]);

  const onSubmit = async (): Promise<void> => {
    // Mode 'all' wipes the explicit selection — empty array means full access on the server.
    const departmentIds = mode === 'all' ? [] : selected;
    try {
      await mutation.mutateAsync({ id: staff.id, departmentIds });
      toast.success(t('staff.editAccess.successToast'));
      onOpenChange(false);
    } catch {
      toast.error(t('staff.editAccess.errorToast'));
    }
  };

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('staff.editAccess.title')}
      description={t('staff.editAccess.description')}
      contentClassName="md:max-w-2xl"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            {t('common.actions.cancel')}
          </Button>
          <WriteButton
            type="button"
            onClick={() => void onSubmit()}
            loading={mutation.isPending}
          >
            {t('staff.editAccess.submit')}
          </WriteButton>
        </>
      }
    >
      <div className="space-y-4">
        {/* Mode toggle — makes the "empty = all" rule explicit instead of hidden inside a hint. */}
        <fieldset className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="radiogroup">
          <legend className="sr-only">{t('staff.editAccess.title')}</legend>
          <button
            type="button"
            role="radio"
            aria-checked={mode === 'all'}
            onClick={() => setMode('all')}
            className={cn(
              'flex items-start gap-3 rounded-md border p-3 text-left transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-1',
              mode === 'all'
                ? 'border-brand-600 bg-brand-50 dark:bg-brand-950'
                : 'border-border hover:bg-muted/40'
            )}
          >
            <Globe className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden />
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium text-foreground">
                {t('staff.access.summaryAll')}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('staff.editAccess.allAccessHint')}
              </p>
            </div>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={mode === 'specific'}
            onClick={() => setMode('specific')}
            className={cn(
              'flex items-start gap-3 rounded-md border p-3 text-left transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-1',
              mode === 'specific'
                ? 'border-brand-600 bg-brand-50 dark:bg-brand-950'
                : 'border-border hover:bg-muted/40'
            )}
          >
            <Check className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden />
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium text-foreground">
                {t('staff.editAccess.title')}
              </p>
              <p className="text-sm text-muted-foreground tabular">
                {mode === 'specific' && totalDepts > 0
                  ? t('staff.access.summary', {
                      count: selected.length,
                      total: totalDepts,
                    })
                  : t('staff.editAccess.description')}
              </p>
            </div>
          </button>
        </fieldset>

        {/* Tree only renders when "specific" is selected — keeps the dialog compact when
           the user just wants the simple "full access" option. */}
        {mode === 'specific' ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">
                {t('staff.editAccess.title')}
              </p>
              {selected.length > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelected([])}
                >
                  {t('common.actions.clear')}
                </Button>
              ) : null}
            </div>
            <DepartmentTreePicker value={selected} onChange={setSelected} />
          </div>
        ) : null}
      </div>
    </ResponsiveSheet>
  );
}
