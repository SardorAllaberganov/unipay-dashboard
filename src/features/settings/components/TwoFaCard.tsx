import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, ShieldOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WriteButton } from '@/components/unipay/WriteButton';
import { Skeleton } from '@/components/ui/skeleton';
import { PanelErrorState } from '@/components/shared/PanelStates';
import { useTwoFactor, useDisableTwoFa, useRegenerateRecoveryCodes } from '../hooks/useTwoFactor';
import { Enable2FaWizard } from './Enable2FaWizard';
import { PasswordConfirmDialog } from './PasswordConfirmDialog';
import { CopyOrLoseItPanel } from './CopyOrLoseItPanel';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function TwoFaCard() {
  const { t } = useTranslation();
  const { data, isPending, isError, refetch } = useTwoFactor();
  const disable = useDisableTwoFa();
  const regen = useRegenerateRecoveryCodes();

  const [wizardOpen, setWizardOpen] = useState(false);
  const [disableOpen, setDisableOpen] = useState(false);
  const [regenOpen, setRegenOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [newCodes, setNewCodes] = useState<string[] | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.security.twoFa.title')}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {t('settings.security.twoFa.subtitle')}
        </p>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <Skeleton className="h-16 w-full" />
        ) : isError ? (
          <PanelErrorState onRetry={() => void refetch()} />
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {data?.enabled ? (
                <ShieldCheck className="size-6 text-success-700" aria-hidden />
              ) : (
                <ShieldOff className="size-6 text-muted-foreground" aria-hidden />
              )}
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground">
                  {data?.enabled
                    ? t('settings.security.twoFa.enabled')
                    : t('settings.security.twoFa.disabled')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {data?.enabled
                    ? t('settings.security.twoFa.enabledHelp')
                    : t('settings.security.twoFa.disabledHelp')}
                </p>
              </div>
            </div>
            {data?.enabled ? (
              <div className="flex flex-wrap items-center gap-2">
                <WriteButton variant="outline" onClick={() => setRegenOpen(true)}>
                  {t('settings.security.twoFa.regenerateCodes')}
                </WriteButton>
                <WriteButton variant="destructive" onClick={() => setDisableOpen(true)}>
                  {t('settings.security.twoFa.disableCta')}
                </WriteButton>
              </div>
            ) : (
              <WriteButton onClick={() => setWizardOpen(true)}>
                {t('settings.security.twoFa.enableCta')}
              </WriteButton>
            )}
          </div>
        )}
      </CardContent>

      <Enable2FaWizard open={wizardOpen} onOpenChange={setWizardOpen} />

      <PasswordConfirmDialog
        open={disableOpen}
        onOpenChange={(o) => {
          setDisableOpen(o);
          if (!o) setServerError(null);
        }}
        title={t('settings.security.twoFa.disableTitle')}
        description={t('settings.security.twoFa.disableDescription')}
        destructive
        requireReason
        confirmLabel={t('settings.security.twoFa.disableCta')}
        loading={disable.isPending}
        errorMessage={serverError ?? undefined}
        onConfirm={({ password, reason }) => {
          setServerError(null);
          disable.mutate(
            { password, reason: reason ?? '' },
            {
              onSuccess: () => setDisableOpen(false),
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

      <PasswordConfirmDialog
        open={regenOpen}
        onOpenChange={(o) => {
          setRegenOpen(o);
          if (!o) setServerError(null);
        }}
        title={t('settings.security.twoFa.regenerateTitle')}
        description={t('settings.security.twoFa.regenerateDescription')}
        confirmLabel={t('settings.security.twoFa.regenerateCta')}
        loading={regen.isPending}
        errorMessage={serverError ?? undefined}
        onConfirm={({ password }) => {
          setServerError(null);
          regen.mutate(password, {
            onSuccess: (data) => {
              setNewCodes(data.recoveryCodes);
              setRegenOpen(false);
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

      <Dialog open={!!newCodes} onOpenChange={(o) => !o && setNewCodes(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('settings.security.twoFa.newCodesTitle')}</DialogTitle>
            <DialogDescription>
              {t('settings.security.twoFa.newCodesDescription')}
            </DialogDescription>
          </DialogHeader>
          {newCodes ? (
            <CopyOrLoseItPanel
              codes={newCodes}
              description={t('settings.security.twoFa.codesIntro')}
            />
          ) : null}
          <DialogFooter>
            <Button onClick={() => setNewCodes(null)}>
              {t('settings.security.twoFa.codesDone')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
