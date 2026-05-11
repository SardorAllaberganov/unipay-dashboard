import { useTranslation } from 'react-i18next';
import { Copy, Pencil, Play, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WriteButton } from '@/components/unipay/WriteButton';
import { AmountDisplay } from '@/components/shared/AmountDisplay';
import { DateDisplay } from '@/components/shared/DateDisplay';
import type { ScheduleTemplate } from '@/types/domain';

interface Props {
  template: ScheduleTemplate;
  onEdit: (template: ScheduleTemplate) => void;
  onDuplicate: (template: ScheduleTemplate) => void;
  onApply: (template: ScheduleTemplate) => void;
  onDelete: (template: ScheduleTemplate) => void;
}

export function TemplateCard({ template, onEdit, onDuplicate, onApply, onDelete }: Props) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-0.5">
            <p className="text-base font-medium text-foreground">{template.name}</p>
            <p className="text-sm text-muted-foreground">
              {t(`students.schedule.paymentTypes.${template.type}`)}
            </p>
          </div>
          {template.amountMode === 'single' && template.amount ? (
            <AmountDisplay value={template.amount} className="text-base font-medium" />
          ) : (
            <span className="text-sm text-muted-foreground">
              {t('students.schedules.card.amountPerDept')}
            </span>
          )}
        </div>

        <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
          <dt className="text-muted-foreground">{t('students.schedules.card.period')}</dt>
          <dd className="text-right text-foreground">{template.periodLabel}</dd>
          <dt className="text-muted-foreground">{t('students.schedules.card.dueDate')}</dt>
          <dd className="text-right text-foreground">
            <DateDisplay value={template.dueDate} />
          </dd>
        </dl>

        <p className="text-sm text-muted-foreground">
          {t('students.schedules.card.appliedTo', { count: template.appliedCount })}
        </p>

        <div className="flex flex-wrap gap-2 pt-1">
          <Button type="button" variant="outline" size="sm" onClick={() => onEdit(template)}>
            <Pencil className="mr-1.5 size-4" aria-hidden />
            {t('students.schedules.card.edit')}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => onDuplicate(template)}>
            <Copy className="mr-1.5 size-4" aria-hidden />
            {t('students.schedules.card.duplicate')}
          </Button>
          <WriteButton type="button" size="sm" onClick={() => onApply(template)}>
            <Play className="mr-1.5 size-4" aria-hidden />
            {t('students.schedules.card.apply')}
          </WriteButton>
          <WriteButton
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onDelete(template)}
            className="ml-auto text-danger-700 hover:bg-danger-50 hover:text-danger-700"
          >
            <Trash2 className="mr-1.5 size-4" aria-hidden />
            {t('students.schedules.card.delete')}
          </WriteButton>
        </div>
      </CardContent>
    </Card>
  );
}
