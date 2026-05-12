// Shown on /payouts/request when balance.plan === 'auto'. Spec §11.3:
// "Ваш аккаунт на автоматических выплатах. Следующая: {date}.
//  Свяжитесь с поддержкой для смены."
import { CheckCircle2, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate, formatRelative } from '@/lib/format';

interface Props {
  nextExpectedAt?: string;
}

export function AutomaticPayoutInfo({ nextExpectedAt }: Props) {
  const { t } = useTranslation();
  return (
    <Card className="flex max-w-2xl flex-col gap-5 p-6">
      <div className="flex items-start gap-3">
        <span
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-success-50 text-success-700"
          aria-hidden
        >
          <CheckCircle2 className="size-5" />
        </span>
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold text-foreground">
            {t('payouts.automatic.title')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('payouts.automatic.body')}
          </p>
          {nextExpectedAt ? (
            <p className="text-sm text-foreground">
              <span className="text-muted-foreground">
                {t('payouts.automatic.nextLabel')}:{' '}
              </span>
              <span className="tabular font-medium">{formatDate(nextExpectedAt)}</span>
              <span className="ml-1 text-muted-foreground">
                ({formatRelative(nextExpectedAt)})
              </span>
            </p>
          ) : null}
        </div>
      </div>
      <Button asChild variant="outline" className="self-start">
        <a href="mailto:support@unipay.dev">
          <Mail className="mr-1.5 size-4" aria-hidden />
          {t('payouts.automatic.contactSupport')}
        </a>
      </Button>
    </Card>
  );
}
