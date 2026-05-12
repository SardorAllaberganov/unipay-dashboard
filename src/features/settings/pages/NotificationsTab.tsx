import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Bell, Mail, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { WriteButton } from '@/components/unipay/WriteButton';
import { PanelErrorState } from '@/components/shared/PanelStates';
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_EVENTS,
  type NotificationChannel,
  type NotificationEvent,
} from '@/types/domain';
import {
  useNotificationsConfig,
  useSaveNotificationsConfig,
} from '../hooks/useNotificationsConfig';
import { notificationsSchema, type NotificationsValues } from '../schemas';

const CHANNEL_ICONS: Record<NotificationChannel, typeof Mail> = {
  email: Mail,
  sms: MessageSquare,
  in_app: Bell,
};

export default function NotificationsTab() {
  const { t } = useTranslation();
  const { data, isPending, isError, refetch } = useNotificationsConfig();
  const save = useSaveNotificationsConfig();

  const form = useForm<NotificationsValues>({
    resolver: zodResolver(notificationsSchema()),
    defaultValues: {
      matrix: emptyMatrix(),
      overdueAlertDays: 3,
    },
  });

  useEffect(() => {
    if (!data) return;
    form.reset({ matrix: data.matrix, overdueAlertDays: data.overdueAlertDays });
  }, [data, form]);

  if (isPending) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }
  if (isError) {
    return (
      <Card>
        <CardContent className="pt-5">
          <PanelErrorState onRetry={() => void refetch()} />
        </CardContent>
      </Card>
    );
  }

  const matrix = form.watch('matrix');

  const onSubmit = form.handleSubmit((values) => {
    save.mutate({ matrix: values.matrix, overdueAlertDays: values.overdueAlertDays });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.notifications.title')}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t('settings.notifications.subtitle')}
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px]">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left text-sm font-medium text-muted-foreground">
                    {t('settings.notifications.eventHeader')}
                  </th>
                  {NOTIFICATION_CHANNELS.map((channel) => {
                    const Icon = CHANNEL_ICONS[channel];
                    return (
                      <th
                        key={channel}
                        className="whitespace-nowrap px-3 py-2 text-right text-sm font-medium text-muted-foreground"
                      >
                        <div className="inline-flex items-center gap-1.5">
                          <Icon className="size-4" aria-hidden />
                          {t(`settings.notifications.channels.${channel}`)}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {NOTIFICATION_EVENTS.map((evt) => (
                  <tr key={evt}>
                    <td className="px-3 py-3 text-sm font-medium text-foreground">
                      {t(`settings.notifications.events.${evt}`)}
                    </td>
                    {NOTIFICATION_CHANNELS.map((channel) => (
                      <td key={channel} className="px-3 py-3 text-right">
                        <div className="flex justify-end">
                          <Switch
                            checked={Boolean(matrix[evt as NotificationEvent]?.[channel])}
                            aria-label={`${t(`settings.notifications.events.${evt}`)} · ${t(`settings.notifications.channels.${channel}`)}`}
                            onCheckedChange={(v) => {
                              const path = `matrix.${evt}.${channel}` as `matrix.${NotificationEvent}.${NotificationChannel}`;
                              // RHF can't infer the typed-path correctness across
                              // a dynamically-built keymap; the literal-string union
                              // assertion above keeps the call site type-safe enough
                              // for the form values shape.
                              (form.setValue as (p: typeof path, v: boolean, o: { shouldDirty: boolean }) => void)(
                                path,
                                v,
                                { shouldDirty: true },
                              );
                            }}
                          />
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.notifications.overdueTitle')}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t('settings.notifications.overdueSubtitle')}
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 sm:max-w-xs">
            <Label htmlFor="overdueAlertDays">
              {t('settings.notifications.overdueLabel')}
            </Label>
            <Input
              id="overdueAlertDays"
              type="number"
              min={1}
              max={90}
              {...form.register('overdueAlertDays', { valueAsNumber: true })}
              aria-invalid={!!form.formState.errors.overdueAlertDays}
            />
            {form.formState.errors.overdueAlertDays ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.overdueAlertDays.message}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t('settings.notifications.overdueHelp')}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

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
  );
}

function emptyMatrix(): NotificationsValues['matrix'] {
  const m = {} as NotificationsValues['matrix'];
  for (const evt of NOTIFICATION_EVENTS) {
    m[evt] = { email: false, sms: false, in_app: false };
  }
  return m;
}
