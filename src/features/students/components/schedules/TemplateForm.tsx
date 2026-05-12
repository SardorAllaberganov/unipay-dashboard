import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { ResponsiveSheet } from '@/components/shared/ResponsiveSheet';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { WriteButton } from '@/components/unipay/WriteButton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Toggle } from '@/components/ui/toggle';
import { TreePicker, type TreeItem } from '@/components/shared/TreePicker';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';
import type { Department, Money, PaymentType, ScheduleTemplate } from '@/types/domain';
import { useDepartments } from '@/features/organization/hooks/useDepartments';
import {
  useCreateTemplate,
  useUpdateTemplate,
} from '../../hooks/useScheduleTemplates';
import { scheduleTemplateSchema, type ScheduleTemplateValues } from '../../schemas';
import { studentsApi, type ScheduleTemplateInput } from '../../api';

const PAYMENT_TYPES: PaymentType[] = ['tuition', 'dormitory', 'other'];
const YEAR_OPTIONS = [1, 2, 3, 4, 5, 6] as const;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: ScheduleTemplate | null;
}

function toTreeItems(items: Department[]): TreeItem[] {
  return items.map((d) => ({
    id: d.id,
    parentId: d.parentId,
    label: d.name.ru,
  }));
}

function parseAmount(raw: string): Money | undefined {
  if (!raw) return undefined;
  const cleaned = raw.replace(/[\s\u00a0]/g, '').replace(',', '.');
  const num = Number(cleaned);
  if (!Number.isFinite(num)) return undefined;
  return { amount: BigInt(Math.max(0, Math.round(num))) * 100n, currency: 'UZS' };
}

function moneyToString(m?: Money): string {
  if (!m) return '';
  return String(Number(m.amount) / 100);
}

function emptyValues(): ScheduleTemplateValues {
  return {
    name: '',
    type: 'tuition',
    amountMode: 'single',
    amount: '',
    perDepartmentAmounts: [],
    dueDate: '',
    periodLabel: '',
    appliesTo: { departmentIds: [], years: [], studentIds: [] },
  };
}

function templateToValues(tpl: ScheduleTemplate): ScheduleTemplateValues {
  return {
    name: tpl.name,
    type: tpl.type,
    amountMode: tpl.amountMode,
    amount: tpl.amountMode === 'single' ? moneyToString(tpl.amount) : '',
    perDepartmentAmounts:
      tpl.perDepartmentAmounts?.map((p) => ({
        departmentId: p.departmentId,
        amount: moneyToString(p.amount),
      })) ?? [],
    dueDate: tpl.dueDate,
    periodLabel: tpl.periodLabel,
    appliesTo: {
      departmentIds: tpl.appliesTo.departmentIds,
      years: tpl.appliesTo.years,
      studentIds: tpl.appliesTo.studentIds,
    },
  };
}

export function TemplateForm({ open, onOpenChange, template }: Props) {
  const { t } = useTranslation();
  const departmentsQuery = useDepartments();
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate(template?.id ?? '');

  const schema = useMemo(() => scheduleTemplateSchema(t), [t]);
  const form = useForm<ScheduleTemplateValues>({
    resolver: zodResolver(schema),
    defaultValues: template ? templateToValues(template) : emptyValues(),
  });

  useEffect(() => {
    if (open) {
      form.reset(template ? templateToValues(template) : emptyValues());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, template?.id]);

  const treeItems = useMemo(
    () => toTreeItems(departmentsQuery.data?.items ?? []),
    [departmentsQuery.data],
  );
  const amountMode = form.watch('amountMode');
  const appliesTo = form.watch('appliesTo');

  // ---- live preview: count students that match appliesTo ----
  const debouncedDepts = useDebounce(appliesTo.departmentIds.join('|'), 250);
  const debouncedYears = useDebounce(appliesTo.years.join('|'), 250);
  const previewQuery = useQuery({
    queryKey: ['students', 'template-preview', debouncedDepts, debouncedYears],
    queryFn: () =>
      studentsApi.list({
        departmentIds: appliesTo.departmentIds,
        years: appliesTo.years,
        pageSize: 1,
      }),
    enabled: open && appliesTo.departmentIds.length > 0,
  });
  const previewCount = previewQuery.data?.total ?? 0;

  const onSubmit = form.handleSubmit(async (values) => {
    const input: ScheduleTemplateInput = {
      name: values.name.trim(),
      type: values.type as PaymentType,
      amountMode: values.amountMode,
      ...(values.amountMode === 'single' && values.amount
        ? { amount: parseAmount(values.amount)! }
        : {}),
      ...(values.amountMode === 'per-department'
        ? {
            perDepartmentAmounts: values.perDepartmentAmounts
              .map((p) => ({
                departmentId: p.departmentId,
                amount: parseAmount(p.amount),
              }))
              .filter((p): p is { departmentId: string; amount: Money } => !!p.amount),
          }
        : {}),
      dueDate: values.dueDate,
      periodLabel: values.periodLabel,
      appliesTo: values.appliesTo,
    };
    try {
      if (template) {
        await updateTemplate.mutateAsync(input);
      } else {
        await createTemplate.mutateAsync(input);
      }
      onOpenChange(false);
    } catch {
      toast.error(t('students.schedule.errorToast'));
    }
  });

  const submitting = createTemplate.isPending || updateTemplate.isPending;

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title={template ? t('students.schedules.form.editTitle') : t('students.schedules.form.createTitle')}
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('students.schedules.form.cancel')}
          </Button>
          <WriteButton type="button" loading={submitting} onClick={() => void onSubmit()}>
            {t('students.schedules.form.save')}
          </WriteButton>
        </>
      }
    >
      <Form {...form}>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void onSubmit(); }}>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('students.schedules.form.name')} *</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('students.schedules.form.type')} *</FormLabel>
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
              name="periodLabel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('students.schedules.form.periodLabel')} *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t('students.add.rowPeriodPlaceholder')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="amountMode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('students.schedules.form.amountMode')}</FormLabel>
                <FormControl>
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="grid gap-2 md:grid-cols-2"
                  >
                    <RadioCard value="single" id="tpl-amount-single">
                      {t('students.schedules.form.amountModeSingle')}
                    </RadioCard>
                    <RadioCard value="per-department" id="tpl-amount-perdept">
                      {t('students.schedules.form.amountModePerDept')}
                    </RadioCard>
                  </RadioGroup>
                </FormControl>
              </FormItem>
            )}
          />

          {amountMode === 'single' ? (
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('students.schedules.form.amount')} *</FormLabel>
                  <FormControl>
                    <Input {...field} inputMode="decimal" className="tabular" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              {t('students.schedules.form.amountModePerDept')}: используйте редактирование
              после сохранения шаблона.
            </p>
          )}

          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('students.schedules.form.dueDate')} *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="appliesTo.departmentIds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('students.schedules.form.appliesToDepts')}</FormLabel>
                <FormControl>
                  <TreePicker
                    mode="multi"
                    items={treeItems}
                    value={field.value}
                    onChange={field.onChange}
                    isLoading={departmentsQuery.isLoading}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="appliesTo.years"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('students.schedules.form.appliesToYears')}</FormLabel>
                <FormControl>
                  <div className="flex flex-wrap gap-1.5">
                    {YEAR_OPTIONS.map((y) => {
                      const selected = field.value.includes(y);
                      return (
                        <Toggle
                          key={y}
                          size="sm"
                          pressed={selected}
                          onPressedChange={(pressed) => {
                            const next = new Set(field.value);
                            if (pressed) next.add(y);
                            else next.delete(y);
                            field.onChange([...next].sort((a, b) => a - b));
                          }}
                          className={cn(
                            'h-8 rounded-md px-2.5 text-sm font-medium',
                            selected
                              ? 'bg-brand-50 text-brand-700 data-[state=on]:bg-brand-50 data-[state=on]:text-brand-700'
                              : 'text-muted-foreground',
                          )}
                        >
                          {y}
                        </Toggle>
                      );
                    })}
                  </div>
                </FormControl>
              </FormItem>
            )}
          />

          {appliesTo.departmentIds.length > 0 ? (
            <p className="rounded-md bg-info-light px-3 py-2 text-sm text-primary tabular">
              {t('students.schedules.form.preview', { count: previewCount })}
            </p>
          ) : null}
        </form>
      </Form>
    </ResponsiveSheet>
  );
}

function RadioCard({ value, id, children }: { value: string; id: string; children: React.ReactNode }) {
  return (
    <Label
      htmlFor={id}
      className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-3 text-sm font-medium hover:bg-muted/40 data-[state=checked]:border-brand-600 data-[state=checked]:bg-brand-50"
    >
      <RadioGroupItem value={value} id={id} />
      <span>{children}</span>
    </Label>
  );
}
