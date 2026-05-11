import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { CalendarIcon, CheckCircle2, ExternalLink, FileDown, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { WriteButton } from '@/components/unipay/WriteButton';
import { DateRangePicker } from '@/components/shared/DateRangePicker';
import {
  resolveDateRange,
  useDateRangeLabel,
  type DateRangeValue,
} from '@/components/shared/dateRange';
import { cn } from '@/lib/utils';
import { buildExportFormSchema, type ExportFormValues } from '../schemas';
import {
  EXPORT_DATA_TYPES,
  EXPORT_FORMATS,
  EXPORT_GROUPINGS,
  type ExportDataType,
  type ExportFormat,
  type ExportGrouping,
} from '../api';
import { useGenerateExport } from '../hooks/useGenerateExport';
import { useExportPolling } from '../hooks/useExportPolling';
import { useReportRangeParam } from '../hooks/useReportRangeParam';

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Defaults reach the form even when the URL has no `?from=&to=` — we want
// "last 30 days" to feel sensible without forcing the picker open.
function defaultIsoRange(): { from: string; to: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const from = new Date(today.getTime() - 29 * 86_400_000);
  return { from: isoDay(from), to: isoDay(today) };
}

export function ExportForm() {
  const { t } = useTranslation();
  const { apiRange } = useReportRangeParam();
  const initial = useMemo(
    () => apiRange ?? defaultIsoRange(),
    [apiRange],
  );

  const form = useForm<ExportFormValues>({
    resolver: zodResolver(buildExportFormSchema(t)),
    defaultValues: {
      dateRange: { from: initial.from, to: initial.to },
      dataType: 'transactions',
      format: 'csv',
      grouping: 'none',
      includeContext: true,
    },
    mode: 'onSubmit',
  });

  // When the URL-level range changes (user picked a new range on Summary, then
  // switched to Export), prefill the form to match — but only if the user
  // hasn't dirtied the field locally. We treat dateRange as the only URL-aware
  // field; the other settings are local to the form.
  useEffect(() => {
    if (!apiRange) return;
    if (form.formState.dirtyFields.dateRange) return;
    form.setValue('dateRange', { from: apiRange.from, to: apiRange.to });
  }, [apiRange, form]);

  const dateRangeValue = form.watch('dateRange');
  const pickerValue: DateRangeValue = useMemo(() => {
    if (!dateRangeValue?.from || !dateRangeValue?.to) {
      return { range: 'custom' };
    }
    return {
      range: 'custom',
      customFrom: new Date(`${dateRangeValue.from}T00:00:00`),
      customTo: new Date(`${dateRangeValue.to}T00:00:00`),
    };
  }, [dateRangeValue]);
  const triggerLabel = useDateRangeLabel(pickerValue);

  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const generate = useGenerateExport();
  const polling = useExportPolling(activeJobId);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const { jobId } = await generate.mutateAsync({
        dateRange: values.dateRange,
        dataType: values.dataType as ExportDataType,
        format: values.format as ExportFormat,
        grouping: values.grouping as ExportGrouping,
        includeContext: values.includeContext,
      });
      setActiveJobId(jobId);
    } catch {
      toast.error(t('reports.export.toasts.generateError'));
    }
  });

  const status = polling.data?.status;
  const etaSeconds = polling.data?.etaSeconds;
  const isGenerating = generate.isPending || status === 'processing';

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('reports.export.title')}</CardTitle>
        <CardDescription>{t('reports.export.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={onSubmit} noValidate>
          {/* Date range */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="export-date-range" className="text-sm font-medium">
              {t('reports.export.form.dateRangeLabel')}
            </Label>
            <Controller
              control={form.control}
              name="dateRange"
              render={({ field }) => (
                <DateRangePicker
                  value={pickerValue}
                  onChange={(next) => {
                    const resolved = resolveDateRange(next);
                    if (resolved?.from && resolved.to) {
                      field.onChange({
                        from: isoDay(resolved.from),
                        to: isoDay(resolved.to),
                      });
                    }
                  }}
                >
                  <Button
                    id="export-date-range"
                    variant="outline"
                    className="w-full justify-between gap-2 font-normal tabular md:w-[320px]"
                    type="button"
                  >
                    <span className="truncate">{triggerLabel}</span>
                    <CalendarIcon
                      className="size-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                  </Button>
                </DateRangePicker>
              )}
            />
          </div>

          {/* Data type — radio */}
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">
              {t('reports.export.form.dataTypeLabel')}
            </legend>
            <Controller
              control={form.control}
              name="dataType"
              render={({ field }) => (
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-4"
                >
                  {EXPORT_DATA_TYPES.map((dt) => (
                    <Label
                      key={dt}
                      htmlFor={`export-dt-${dt}`}
                      className={cn(
                        'flex h-11 cursor-pointer items-center gap-3 rounded-lg border border-border bg-card px-3 text-sm font-medium transition-colors',
                        field.value === dt
                          ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300'
                          : 'hover:bg-muted/40',
                      )}
                    >
                      <RadioGroupItem id={`export-dt-${dt}`} value={dt} className="size-4" />
                      <span>{t(`reports.export.form.dataType.${dt}`)}</span>
                    </Label>
                  ))}
                </RadioGroup>
              )}
            />
          </fieldset>

          {/* Format — chip toggles */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium">
              {t('reports.export.form.formatLabel')}
            </Label>
            <Controller
              control={form.control}
              name="format"
              render={({ field }) => (
                <div role="radiogroup" className="flex flex-wrap items-center gap-2">
                  {EXPORT_FORMATS.map((f) => {
                    const active = field.value === f;
                    return (
                      <button
                        key={f}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => field.onChange(f)}
                        className={cn(
                          'inline-flex h-11 min-w-[88px] items-center justify-center rounded-lg border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                          active
                            ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300'
                            : 'border-border bg-card text-foreground hover:bg-muted/40',
                        )}
                      >
                        {t(`reports.export.form.format.${f}`)}
                      </button>
                    );
                  })}
                </div>
              )}
            />
          </div>

          {/* Grouping — Select */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="export-grouping" className="text-sm font-medium">
              {t('reports.export.form.groupingLabel')}
            </Label>
            <Controller
              control={form.control}
              name="grouping"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="export-grouping" className="md:w-[320px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPORT_GROUPINGS.map((g) => (
                      <SelectItem key={g} value={g}>
                        {t(`reports.export.form.grouping.${g}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Include context — Switch */}
          <Controller
            control={form.control}
            name="includeContext"
            render={({ field }) => (
              <div className="flex items-start gap-3">
                <Switch
                  id="export-include-context"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <div className="space-y-0.5">
                  <Label
                    htmlFor="export-include-context"
                    className="text-sm font-medium"
                  >
                    {t('reports.export.form.includeContextLabel')}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t('reports.export.form.includeContextHint')}
                  </p>
                </div>
              </div>
            )}
          />

          {/* Submit + inline progress note. Progress note replaces a spinner-only
              loading state per the Prompt 8 acceptance ("…never spinner-only"). */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <WriteButton
              type="submit"
              disabled={isGenerating}
              aria-busy={isGenerating || undefined}
              className="w-full sm:w-auto"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                  {t('reports.export.form.submitGenerating')}
                </>
              ) : (
                <>
                  <FileDown className="mr-2 size-4" aria-hidden />
                  {t('reports.export.form.submit')}
                </>
              )}
            </WriteButton>

            {status === 'processing' ? (
              <p
                role="status"
                aria-live="polite"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Loader2 className="size-4 animate-spin" aria-hidden />
                <span>
                  {t('reports.export.progress.preparing', {
                    seconds: etaSeconds ?? 3,
                  })}
                </span>
              </p>
            ) : null}
            {status === 'ready' ? (
              <p
                role="status"
                aria-live="polite"
                className="inline-flex items-center gap-2 text-sm text-success-700 dark:text-success-400"
              >
                <CheckCircle2 className="size-4" aria-hidden />
                <span>{t('reports.export.progress.ready')}</span>
                {polling.data?.url ? (
                  <a
                    href={polling.data.url}
                    className="inline-flex items-center gap-1 underline-offset-4 hover:underline"
                  >
                    {t('reports.export.progress.openCta')}
                    <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                ) : null}
              </p>
            ) : null}
            {status === 'failed' ? (
              <p role="status" className="text-sm text-destructive">
                {t('reports.export.progress.failed')}
              </p>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
