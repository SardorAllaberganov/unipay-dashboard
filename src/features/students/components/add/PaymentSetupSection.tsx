import { useTranslation } from 'react-i18next';
import { Plus, Trash2 } from 'lucide-react';
import { useFieldArray, type UseFormReturn } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PaymentType, ScheduleTemplate } from '@/types/domain';
import type { AddStudentValues } from '../../schemas';

const PAYMENT_TYPES: PaymentType[] = ['tuition', 'dormitory', 'other'];

interface Props {
  form: UseFormReturn<AddStudentValues>;
  templates: ScheduleTemplate[];
}

export function PaymentSetupSection({ form, templates }: Props) {
  const { t } = useTranslation();
  const useTemplate = form.watch('useTemplate');

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'rows',
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('students.add.sectionPayment')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
        control={form.control}
        name="useTemplate"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-3">
            <div>
              <FormLabel className="text-sm font-medium">
                {t('students.add.applyTemplate')}
              </FormLabel>
              <p className="text-sm text-muted-foreground">
                {t('students.add.applyTemplateHint')}
              </p>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />

      {useTemplate ? (
        <FormField
          control={form.control}
          name="templateId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('students.add.pickTemplate')}</FormLabel>
              <FormControl>
                <Select value={field.value ?? ''} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('students.add.pickTemplate')} />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((tpl) => (
                      <SelectItem key={tpl.id} value={tpl.id}>
                        {tpl.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : (
        <div className="space-y-3">
          {fields.map((row, idx) => (
            <div
              key={row.id}
              className="grid gap-3 rounded-lg border border-border p-3 md:grid-cols-[1fr_140px_140px_140px_auto]"
            >
              <FormField
                control={form.control}
                name={`rows.${idx}.period`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">
                      {t('students.add.rowPeriod')}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('students.add.rowPeriodPlaceholder')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`rows.${idx}.type`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">
                      {t('students.add.rowType')}
                    </FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_TYPES.map((p) => (
                            <SelectItem key={p} value={p}>
                              {t(`students.schedule.paymentTypes.${p}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`rows.${idx}.amount`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">
                      {t('students.add.rowAmount')}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} inputMode="numeric" className="tabular" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`rows.${idx}.dueDate`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">
                      {t('students.add.rowDueDate')}
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-end justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="size-9 p-0 text-muted-foreground hover:text-danger-700"
                  onClick={() => remove(idx)}
                  aria-label={t('students.add.removeRow')}
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              append({
                period: '',
                type: 'tuition',
                amount: '',
                dueDate: '',
              })
            }
          >
            <Plus className="mr-1 size-4" aria-hidden />
            {t('students.add.addRow')}
          </Button>
        </div>
      )}
      </CardContent>
    </Card>
  );
}
