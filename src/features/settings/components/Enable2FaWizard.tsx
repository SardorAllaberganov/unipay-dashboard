// 3-step 2FA enable wizard inside a Dialog: scan QR → enter 6-digit code → save
// recovery codes (one-time view). Uses the existing Dialog primitive directly
// so the active step can swap content while keeping the same modal shell.
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, ShieldCheck } from 'lucide-react';
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
import { WriteButton } from '@/components/unipay/WriteButton';
import { useInitTwoFa, useVerifyTwoFa } from '../hooks/useTwoFactor';
import { CopyOrLoseItPanel } from './CopyOrLoseItPanel';
import { CopyableTextRow } from './CopyableTextRow';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'scan' | 'verify' | 'codes';

export function Enable2FaWizard({ open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const init = useInitTwoFa();
  const verify = useVerifyTwoFa();
  const [step, setStep] = useState<Step>('scan');
  const [qr, setQr] = useState<{ qrSvgDataUri: string; secret: string } | null>(null);
  const [code, setCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [codeError, setCodeError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setStep('scan');
      setQr(null);
      setCode('');
      setRecoveryCodes([]);
      setCodeError(null);
      return;
    }
    if (!qr && !init.isPending) {
      init.mutate(undefined, {
        onSuccess: (data) => setQr(data),
      });
    }
  }, [open, qr, init]);

  const onVerify = () => {
    setCodeError(null);
    if (!/^\d{6}$/.test(code)) {
      setCodeError(t('settings.security.twoFa.codeFormat'));
      return;
    }
    verify.mutate(code, {
      onSuccess: (data) => {
        setRecoveryCodes(data.recoveryCodes);
        setStep('codes');
      },
      onError: () => {
        setCodeError(t('settings.security.twoFa.codeInvalid'));
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-brand-600" aria-hidden />
            {t('settings.security.twoFa.enableTitle')}
          </DialogTitle>
          <DialogDescription>
            {step === 'scan'
              ? t('settings.security.twoFa.scanHelp')
              : step === 'verify'
                ? t('settings.security.twoFa.verifyHelp')
                : t('settings.security.twoFa.codesHelp')}
          </DialogDescription>
        </DialogHeader>

        {step === 'scan' ? (
          <div className="space-y-4">
            {qr ? (
              <div className="flex flex-col items-center gap-3">
                <img
                  src={qr.qrSvgDataUri}
                  alt={t('settings.security.twoFa.qrAlt')}
                  className="size-48 rounded-lg border border-border bg-white p-3"
                />
                <CopyableTextRow
                  value={qr.secret}
                  label={t('settings.security.twoFa.manualEntry')}
                />
              </div>
            ) : (
              <div
                className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 px-6 py-12 text-sm text-muted-foreground"
                role="status"
                aria-live="polite"
              >
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {t('common.states.loading')}
              </div>
            )}
          </div>
        ) : null}

        {step === 'verify' ? (
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="twofa-code">{t('settings.security.twoFa.codeLabel')}</Label>
              <Input
                id="twofa-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="font-mono tabular tracking-[0.4em] text-center text-base"
                aria-invalid={!!codeError}
              />
              {codeError ? (
                <p className="text-sm text-destructive" role="alert">
                  {codeError}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {step === 'codes' ? (
          <CopyOrLoseItPanel
            codes={recoveryCodes}
            description={t('settings.security.twoFa.codesIntro')}
          />
        ) : null}

        <DialogFooter>
          {step === 'scan' ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t('common.actions.cancel')}
              </Button>
              <Button onClick={() => setStep('verify')} disabled={!qr}>
                {t('common.actions.next')}
              </Button>
            </>
          ) : null}
          {step === 'verify' ? (
            <>
              <Button variant="outline" onClick={() => setStep('scan')}>
                {t('common.actions.back')}
              </Button>
              <WriteButton onClick={onVerify} loading={verify.isPending}>
                {t('settings.security.twoFa.verifyCta')}
              </WriteButton>
            </>
          ) : null}
          {step === 'codes' ? (
            <Button onClick={() => onOpenChange(false)}>
              {t('settings.security.twoFa.codesDone')}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
