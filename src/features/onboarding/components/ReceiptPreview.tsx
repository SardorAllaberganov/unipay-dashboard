import { useTranslation } from 'react-i18next';

interface Props {
  orgName?: string;
  logoDataUrl?: string;
  primaryColor?: string;
  receiptFooter?: string;
}

export function ReceiptPreview({
  orgName,
  logoDataUrl,
  primaryColor = '#1558B0',
  receiptFooter,
}: Props) {
  const { t } = useTranslation();
  const safeColor = /^#[0-9a-fA-F]{6}$/.test(primaryColor) ? primaryColor : '#1558B0';

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="mb-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
        {t('onboarding.receipt.previewLabel')}
      </div>
      <div className="space-y-3 text-sm">
        <div
          className="flex items-center gap-2 border-b border-border pb-3"
          style={{ color: safeColor }}
        >
          {logoDataUrl ? (
            <img src={logoDataUrl} alt="" className="size-8 rounded object-contain" />
          ) : null}
          <div className="font-semibold">{orgName || t('onboarding.receipt.placeholderOrg')}</div>
        </div>
        <div className="tabular space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('onboarding.receipt.studentLabel')}</span>
            <span>{t('onboarding.receipt.studentSample')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('onboarding.receipt.periodLabel')}</span>
            <span>{t('onboarding.receipt.periodSample')}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2 font-medium">
            <span>{t('onboarding.receipt.totalLabel')}</span>
            <span>4 200 000 UZS</span>
          </div>
        </div>
        {receiptFooter ? (
          <div className="border-t border-border pt-3 text-sm text-muted-foreground">
            {receiptFooter}
          </div>
        ) : null}
      </div>
    </div>
  );
}
