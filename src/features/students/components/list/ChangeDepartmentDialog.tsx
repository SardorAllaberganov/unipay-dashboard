import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { WriteButton } from '@/components/unipay/WriteButton';
import { TreePicker, type TreeItem } from '@/components/shared/TreePicker';
import type { Department } from '@/types/domain';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  departments: Department[];
  isDepartmentsLoading?: boolean;
  onConfirm: (departmentId: string) => Promise<void> | void;
}

function toTreeItems(items: Department[]): TreeItem[] {
  return items.map((d) => ({
    id: d.id,
    parentId: d.parentId,
    label: d.name.ru,
  }));
}

export function ChangeDepartmentDialog({ open, onOpenChange, count, departments, isDepartmentsLoading, onConfirm }: Props) {
  const { t } = useTranslation();
  const [picked, setPicked] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setPicked(null);
      setSubmitting(false);
    }
  }, [open]);

  const treeItems = useMemo(() => toTreeItems(departments), [departments]);

  const handleConfirm = async () => {
    if (!picked) return;
    setSubmitting(true);
    try {
      await onConfirm(picked);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('students.bulk.changeDeptTitle')}</DialogTitle>
          <DialogDescription>{t('students.bulk.changeDeptBody', { count })}</DialogDescription>
        </DialogHeader>
        <TreePicker
          mode="single"
          leafOnly
          items={treeItems}
          value={picked}
          onChange={setPicked}
          isLoading={isDepartmentsLoading}
          searchPlaceholder={t('students.filters.searchDepartment')}
          hint={t('students.add.departmentHint')}
        />
        <DialogFooter>
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
            {t('common.actions.cancel')}
          </Button>
          <WriteButton type="button" disabled={!picked || submitting} onClick={handleConfirm}>
            {t('students.bulk.changeDeptConfirm')}
          </WriteButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
