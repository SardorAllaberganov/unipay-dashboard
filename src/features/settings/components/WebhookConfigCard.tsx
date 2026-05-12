import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Eye, RefreshCcw, XCircle, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { WriteButton } from '@/components/unipay/WriteButton';
import { PanelErrorState } from '@/components/shared/PanelStates';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { WEBHOOK_EVENTS, type WebhookEvent } from '@/types/domain';
import {
  useWebhookConfig,
  useSaveWebhookConfig,
  useTestWebhook,
  useRevealWebhookSecret,
  useRotateWebhookSecret,
} from '../hooks/useWebhook';
import { webhookConfigSchema, type WebhookConfigValues } from '../schemas';
import { PasswordConfirmDialog } from './PasswordConfirmDialog';
import { CopyableTextRow } from './CopyableTextRow';

interface TestResult {
  status: 'success' | 'failed';
  responseCode: number;
  durationMs: number;
}

export function WebhookConfigCard() {
  const { t } = useTranslation();
  const { data, isPending, isError, refetch } = useWebhookConfig();
  const save = useSaveWebhookConfig();
  const testIt = useTestWebhook();
  const reveal = useRevealWebhookSecret();
  const rotate = useRotateWebhookSecret();

  const form = useForm<WebhookConfigValues>({
    resolver: zodResolver(webhookConfigSchema(t)),
    defaultValues: { url: '', events: [], enabled: true },
  });

  useEffect(() => {
    if (!data) return;
    form.reset({ url: data.url, events: data.events, enabled: data.enabled });
  }, [data, form]);

  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [revealOpen, setRevealOpen] = useState(false);
  const [rotateOpen, setRotateOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  const [rotatedSecret, setRotatedSecret] = useState<string | null>(null);

  const onSubmit = form.handleSubmit((values) => {
    save.mutate({ url: values.url, events: values.events, enabled: values.enabled });
  });

  if (isPending) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.webhook.title')}</CardTitle>
        <p className="text-sm text-muted-foreground">{t('settings.webhook.subtitle')}</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          <div className="flex flex-col gap-2">
            <Label htmlFor="webhook-url">{t('settings.webhook.urlLabel')}</Label>
            <Input
              id="webhook-url"
              type="url"
              inputMode="url"
              placeholder="https://your-server.example/webhook"
              {...form.register('url')}
              aria-invalid={!!form.formState.errors.url}
            />
            {form.formState.errors.url ? (
              <p className="text-sm text-destructive">{form.formState.errors.url.message}</p>
            ) : null}
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-foreground">
              {t('settings.webhook.eventsLabel')}
            </legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {WEBHOOK_EVENTS.map((evt) => (
                <WebhookEventCheckbox
                  key={evt}
                  evt={evt}
                  checked={form.watch('events').includes(evt)}
                  onCheckedChange={(checked) => {
                    const list = form.getValues('events');
                    const next = checked
                      ? [...list, evt]
                      : list.filter((e) => e !== evt);
                    form.setValue('events', next, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                />
              ))}
            </div>
            {form.formState.errors.events ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.events.message}
              </p>
            ) : null}
          </fieldset>

          <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                {t('settings.webhook.enabledLabel')}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('settings.webhook.enabledHelp')}
              </p>
            </div>
            <Switch
              checked={form.watch('enabled')}
              onCheckedChange={(v) =>
                form.setValue('enabled', v, { shouldDirty: true })
              }
              aria-label={t('settings.webhook.enabledLabel')}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <WriteButton
              type="button"
              variant="outline"
              onClick={() => {
                setTestResult(null);
                testIt.mutate(undefined, {
                  onSuccess: (data) => setTestResult(data),
                });
              }}
              loading={testIt.isPending}
            >
              <Zap className="size-4" aria-hidden />
              {t('settings.webhook.testCta')}
            </WriteButton>
            <WriteButton
              type="submit"
              loading={save.isPending}
              disabled={!form.formState.isDirty || save.isPending}
            >
              {t('common.actions.save')}
            </WriteButton>
          </div>

          {testResult ? (
            <div
              role="status"
              aria-live="polite"
              className={
                testResult.status === 'success'
                  ? 'flex items-start gap-2 rounded-lg border border-success-700/30 bg-success-light px-3 py-2 text-sm text-success-foreground'
                  : 'flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive'
              }
            >
              {testResult.status === 'success' ? (
                <CheckCircle2 className="size-4 shrink-0" aria-hidden />
              ) : (
                <XCircle className="size-4 shrink-0" aria-hidden />
              )}
              <p>
                {testResult.status === 'success'
                  ? t('settings.webhook.testSuccess', {
                      code: testResult.responseCode,
                      ms: testResult.durationMs,
                    })
                  : t('settings.webhook.testFailed', {
                      code: testResult.responseCode,
                      ms: testResult.durationMs,
                    })}
              </p>
            </div>
          ) : null}

          {/* Signing secret */}
          <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {t('settings.webhook.secretLabel')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('settings.webhook.secretHelp')}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRevealOpen(true)}
                >
                  <Eye className="size-3.5" aria-hidden />
                  {t('common.actions.show')}
                </Button>
                <WriteButton
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => setRotateOpen(true)}
                >
                  <RefreshCcw className="size-3.5" aria-hidden />
                  {t('settings.webhook.rotateCta')}
                </WriteButton>
              </div>
            </div>
            <p className="font-mono text-sm tabular text-muted-foreground">
              whsec_••••••••••••••••••••••••••••••••
            </p>
          </div>
        </form>
      </CardContent>

      {/* Reveal — password-confirm */}
      <PasswordConfirmDialog
        open={revealOpen && !revealedSecret}
        onOpenChange={(o) => {
          if (!o) {
            setRevealOpen(false);
            setServerError(null);
          }
        }}
        title={t('settings.webhook.revealTitle')}
        description={t('settings.webhook.revealDescription')}
        confirmLabel={t('common.actions.show')}
        loading={reveal.isPending}
        errorMessage={serverError ?? undefined}
        onConfirm={({ password }) => {
          setServerError(null);
          reveal.mutate(password, {
            onSuccess: (data) => {
              setRevealedSecret(data.plaintext);
              setRevealOpen(false);
            },
            onError: (err) => {
              const code = (err as { body?: { error?: { code?: string } } }).body?.error
                ?.code;
              setServerError(
                code === 'invalid_password'
                  ? t('settings.passwordConfirm.invalid')
                  : t('common.errors.saveFailed'),
              );
            },
          });
        }}
      />
      <Dialog open={!!revealedSecret} onOpenChange={(o) => !o && setRevealedSecret(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('settings.webhook.secretShown')}</DialogTitle>
            <DialogDescription>{t('settings.webhook.secretShownHelp')}</DialogDescription>
          </DialogHeader>
          {revealedSecret ? <CopyableTextRow value={revealedSecret} /> : null}
          <DialogFooter>
            <Button onClick={() => setRevealedSecret(null)}>
              {t('common.actions.done')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rotate — password + reason ≥20 */}
      <PasswordConfirmDialog
        open={rotateOpen && !rotatedSecret}
        onOpenChange={(o) => {
          if (!o) {
            setRotateOpen(false);
            setServerError(null);
          }
        }}
        title={t('settings.webhook.rotateTitle')}
        description={t('settings.webhook.rotateDescription')}
        destructive
        requireReason
        confirmLabel={t('settings.webhook.rotateCta')}
        loading={rotate.isPending}
        errorMessage={serverError ?? undefined}
        onConfirm={({ password, reason }) => {
          setServerError(null);
          rotate.mutate(
            { password, reason: reason ?? '' },
            {
              onSuccess: (data) => {
                setRotatedSecret(data.plaintext);
                setRotateOpen(false);
              },
              onError: (err) => {
                const code = (err as { body?: { error?: { code?: string } } }).body?.error
                  ?.code;
                setServerError(
                  code === 'invalid_password'
                    ? t('settings.passwordConfirm.invalid')
                    : t('common.errors.saveFailed'),
                );
              },
            },
          );
        }}
      />
      <Dialog open={!!rotatedSecret} onOpenChange={(o) => !o && setRotatedSecret(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('settings.webhook.rotatedTitle')}</DialogTitle>
            <DialogDescription>{t('settings.webhook.rotatedDescription')}</DialogDescription>
          </DialogHeader>
          {rotatedSecret ? <CopyableTextRow value={rotatedSecret} /> : null}
          <DialogFooter>
            <Button onClick={() => setRotatedSecret(null)}>
              {t('common.actions.done')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function WebhookEventCheckbox({
  evt,
  checked,
  onCheckedChange,
}: {
  evt: WebhookEvent;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  const { t } = useTranslation();
  return (
    <Label
      htmlFor={`webhook-evt-${evt}`}
      className="flex cursor-pointer items-center gap-2.5 rounded-md border border-border bg-card px-3 py-2 transition-colors hover:bg-muted/30"
    >
      <Checkbox
        id={`webhook-evt-${evt}`}
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(v === true)}
      />
      <span className="font-mono text-xs tabular text-foreground">
        {t(`settings.webhook.eventLabels.${evt}`, evt)}
      </span>
    </Label>
  );
}
