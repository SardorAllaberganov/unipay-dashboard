import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { WriteButton } from '@/components/unipay/WriteButton';
import { cn } from '@/lib/utils';
import type { ScheduleTemplate } from '@/types/domain';
import { studentsApi } from '../../api';
import { useApplyTemplate } from '../../hooks/useScheduleTemplates';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: ScheduleTemplate | null;
}

export function ApplyTemplateDialog({ open, onOpenChange, template }: Props) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const apply = useApplyTemplate(template?.id ?? '');

  useEffect(() => {
    if (!open) setReason('');
  }, [open]);

  const previewQuery = useQuery({
    queryKey: ['students', 'apply-preview', template?.id],
    queryFn: () =>
      studentsApi.list({
        departmentIds: template?.appliesTo.departmentIds ?? [],
        years: template?.appliesTo.years ?? [],
        pageSize: 1,
      }),
    enabled: open && !!template,
  });
  const count = previewQuery.data?.total ?? template?.appliedCount ?? 0;

  const handleConfirm = async () => {
    if (!template || reason.trim().length < 20) return;
    await apply.mutateAsync({
      departmentIds: template.appliesTo.departmentIds,
      years: template.appliesTo.years,
      studentIds: template.appliesTo.studentIds,
      reason: reason.trim(),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('students.schedules.apply.title')}</DialogTitle>
          <DialogDescription>
            {template
              ? t('students.schedules.apply.body', { name: template.name, count })
              : null}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="apply-tpl-reason" className="text-sm font-medium">
            {t('common.reasonLabel', { count: 20 })}
          </Label>
          <Textarea
            id="apply-tpl-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder={t('students.schedules.apply.reasonHint')}
          />
          <p
            className={cn(
              'text-sm',
              reason.trim().length >= 20 ? 'text-success-700' : 'text-muted-foreground',
            )}
          >
            {reason.trim().length} / 20
          </p>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.actions.cancel')}
          </Button>
          <WriteButton
            type="button"
            disabled={reason.trim().length < 20 || apply.isPending}
            loading={apply.isPending}
            onClick={() => void handleConfirm()}
          >
            {t('students.schedules.apply.confirm')}
          </WriteButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
