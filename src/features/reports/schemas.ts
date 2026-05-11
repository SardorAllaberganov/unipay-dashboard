import { z } from 'zod';
import type { TFunction } from 'i18next';
import { EXPORT_DATA_TYPES, EXPORT_FORMATS, EXPORT_GROUPINGS } from './api';

const enumFromList = <T extends [string, ...string[]]>(values: T) =>
  z.enum(values);

export function buildExportFormSchema(t: TFunction) {
  return z
    .object({
      dateRange: z.object(
        {
          from: z.string().min(1, t('reports.export.form.dateRangeLabel')),
          to: z.string().min(1, t('reports.export.form.dateRangeLabel')),
        },
        { required_error: t('reports.export.form.dateRangeLabel') },
      ),
      dataType: enumFromList(EXPORT_DATA_TYPES as [string, ...string[]]),
      format: enumFromList(EXPORT_FORMATS as [string, ...string[]]),
      grouping: enumFromList(EXPORT_GROUPINGS as [string, ...string[]]),
      includeContext: z.boolean(),
    })
    .refine((v) => v.dateRange.from <= v.dateRange.to, {
      path: ['dateRange'],
      message: t('reports.export.form.dateRangeLabel'),
    });
}

export type ExportFormValues = z.infer<ReturnType<typeof buildExportFormSchema>>;
