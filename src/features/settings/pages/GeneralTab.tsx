import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { WriteButton } from '@/components/unipay/WriteButton';
import {
  PanelEmptyState,
  PanelErrorState,
} from '@/components/shared/PanelStates';
import { Skeleton } from '@/components/ui/skeleton';
import { useGeneralSettings, useUpdateGeneralSettings } from '../hooks/useGeneralSettings';
import { generalSchema, type GeneralValues } from '../schemas';

const TIMEZONES = [
  { value: 'Asia/Tashkent', labelKey: 'settings.general.timezones.tashkent' },
  { value: 'Asia/Almaty', labelKey: 'settings.general.timezones.almaty' },
  { value: 'Europe/Moscow', labelKey: 'settings.general.timezones.moscow' },
  { value: 'UTC', labelKey: 'settings.general.timezones.utc' },
] as const;

export default function GeneralTab() {
  const { t } = useTranslation();
  const { data, isPending, isError, refetch } = useGeneralSettings();
  const save = useUpdateGeneralSettings();

  const form = useForm<GeneralValues>({
    resolver: zodResolver(generalSchema(t)),
    defaultValues: {
      contactEmail: '',
      contactPhone: '',
      timezone: 'Asia/Tashkent',
      language: 'ru',
    },
  });

  useEffect(() => {
    if (!data) return;
    form.reset({
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      timezone: data.timezone,
      language: data.language,
    });
  }, [data, form]);

  if (isPending) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }
  if (isError) {
    return <PanelErrorState onRetry={() => void refetch()} />;
  }
  if (!data) {
    return <PanelEmptyState />;
  }

  const onSubmit = form.handleSubmit((values) => {
    save.mutate(values);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.general.title')}</CardTitle>
        <p className="text-sm text-muted-foreground">{t('settings.general.subtitle')}</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          {/* Read-only org name */}
          <div className="flex flex-col gap-2">
            <Label>{t('settings.general.orgName.label')}</Label>
            <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {data.organizationName}
                </p>
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Lock className="size-3.5" aria-hidden />
                  {t('settings.general.orgName.readonlyHint')}
                </p>
              </div>
              <Link
                to="/organization/profile"
                className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800 dark:text-brand-300"
              >
                {t('settings.general.orgName.editLink')}
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>{t('settings.general.tin.label')}</Label>
            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
              <p className="font-mono text-sm tabular text-foreground">{data.tin}</p>
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <Lock className="size-3.5" aria-hidden />
                {t('settings.general.tin.readonlyHint')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="contactEmail">{t('settings.general.email.label')}</Label>
              <Input
                id="contactEmail"
                type="email"
                {...form.register('contactEmail')}
                aria-invalid={!!form.formState.errors.contactEmail}
              />
              {form.formState.errors.contactEmail ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.contactEmail.message}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="contactPhone">{t('settings.general.phone.label')}</Label>
              <Input
                id="contactPhone"
                type="tel"
                {...form.register('contactPhone')}
                aria-invalid={!!form.formState.errors.contactPhone}
              />
              {form.formState.errors.contactPhone ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.contactPhone.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>{t('settings.general.timezone.label')}</Label>
              <Select
                value={form.watch('timezone')}
                onValueChange={(v) => form.setValue('timezone', v, { shouldDirty: true })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {t(tz.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t('settings.general.language.label')}</Label>
              <Select
                value={form.watch('language')}
                onValueChange={(v) =>
                  form.setValue('language', v as 'ru' | 'uz', { shouldDirty: true })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ru">{t('settings.general.language.ru')}</SelectItem>
                  <SelectItem value="uz">{t('settings.general.language.uz')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end">
            <WriteButton
              type="submit"
              loading={save.isPending}
              disabled={!form.formState.isDirty || save.isPending}
            >
              {t('common.actions.save')}
            </WriteButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
