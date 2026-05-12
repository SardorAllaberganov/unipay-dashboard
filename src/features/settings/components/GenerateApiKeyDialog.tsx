import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { WriteButton } from '@/components/unipay/WriteButton';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { API_KEY_PERMISSIONS, type ApiKeyPermission } from '@/types/domain';
import { useCreateApiKey } from '../hooks/useApiKeys';
import { createApiKeySchema, type CreateApiKeyValues } from '../schemas';
import { CopyOrLoseItPanel } from './CopyOrLoseItPanel';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Stage = 'form' | 'reveal';

export function GenerateApiKeyDialog({ open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const create = useCreateApiKey();
  const [stage, setStage] = useState<Stage>('form');
  const [plaintext, setPlaintext] = useState<string | null>(null);
  const [closeWarn, setCloseWarn] = useState(false);

  const form = useForm<CreateApiKeyValues>({
    resolver: zodResolver(createApiKeySchema(t)),
    defaultValues: { name: '', permissions: [] },
  });

  const reset = () => {
    form.reset({ name: '', permissions: [] });
    setStage('form');
    setPlaintext(null);
  };

  const onSubmit = form.handleSubmit((values) => {
    create.mutate(values, {
      onSuccess: (data) => {
        setPlaintext(data.plaintext);
        setStage('reveal');
      },
    });
  });

  const handleDialogChange = (next: boolean) => {
    if (!next && stage === 'reveal') {
      setCloseWarn(true);
      return;
    }
    onOpenChange(next);
    if (!next) reset();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {stage === 'form'
                ? t('settings.api.generateTitle')
                : t('settings.api.generatedTitle')}
            </DialogTitle>
            <DialogDescription>
              {stage === 'form'
                ? t('settings.api.generateDescription')
                : t('settings.api.generatedDescription')}
            </DialogDescription>
          </DialogHeader>

          {stage === 'form' ? (
            <form id="generate-api-key-form" onSubmit={onSubmit} className="space-y-4" noValidate>
              <div className="flex flex-col gap-2">
                <Label htmlFor="apik-name">{t('settings.api.nameLabel')}</Label>
                <Input
                  id="apik-name"
                  {...form.register('name')}
                  aria-invalid={!!form.formState.errors.name}
                  placeholder={t('settings.api.namePlaceholder')}
                />
                {form.formState.errors.name ? (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                ) : null}
              </div>

              <fieldset className="space-y-2">
                <legend className="text-sm font-medium text-foreground">
                  {t('settings.api.permissionsLabel')}
                </legend>
                <div className="space-y-2">
                  {API_KEY_PERMISSIONS.map((perm) => (
                    <PermissionCheckbox
                      key={perm}
                      perm={perm}
                      checked={form.watch('permissions').includes(perm)}
                      onCheckedChange={(checked) => {
                        const list = form.getValues('permissions');
                        const next = checked
                          ? [...list, perm]
                          : list.filter((p) => p !== perm);
                        form.setValue('permissions', next, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }}
                    />
                  ))}
                </div>
                {form.formState.errors.permissions ? (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.permissions.message}
                  </p>
                ) : null}
              </fieldset>
            </form>
          ) : null}

          {stage === 'reveal' && plaintext ? (
            <CopyOrLoseItPanel
              plaintext={plaintext}
              description={t('settings.api.copyOrLoseDescription')}
            />
          ) : null}

          <DialogFooter>
            {stage === 'form' ? (
              <>
                <Button variant="outline" onClick={() => handleDialogChange(false)}>
                  {t('common.actions.cancel')}
                </Button>
                <WriteButton
                  type="submit"
                  form="generate-api-key-form"
                  loading={create.isPending}
                >
                  {t('settings.api.generateCta')}
                </WriteButton>
              </>
            ) : (
              <Button onClick={() => handleDialogChange(false)}>
                {t('settings.api.doneCta')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={closeWarn}
        onOpenChange={setCloseWarn}
        title={t('settings.api.closeWarnTitle')}
        description={t('settings.api.closeWarnBody')}
        destructive
        confirmLabel={t('settings.api.closeWarnConfirm')}
        cancelLabel={t('settings.api.closeWarnCancel')}
        onConfirm={() => {
          setCloseWarn(false);
          onOpenChange(false);
          reset();
        }}
      />
    </>
  );
}

function PermissionCheckbox({
  perm,
  checked,
  onCheckedChange,
}: {
  perm: ApiKeyPermission;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  const { t } = useTranslation();
  return (
    <Label
      htmlFor={`perm-${perm}`}
      className="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-card p-3 transition-colors hover:bg-muted/30"
    >
      <Checkbox
        id={`perm-${perm}`}
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(v === true)}
        className="mt-0.5"
      />
      <div className="space-y-0.5">
        <p className="font-mono text-xs tabular text-foreground">{perm}</p>
        <p className="text-sm text-muted-foreground">{t(`settings.api.permLabels.${perm}`)}</p>
      </div>
    </Label>
  );
}
