// /payouts/request — Pattern A standalone page. Branches on the live balance.plan:
//   plan === 'request' → <RequestPayoutForm>
//   plan === 'auto'    → <AutomaticPayoutInfo> (info card; no form)
import { useTranslation } from 'react-i18next';
import { BackLink } from '@/components/shared/BackLink';
import { ErrorState } from '@/components/shared/ErrorState';
import { OfflineState } from '@/components/shared/OfflineState';
import { Skeleton } from '@/components/ui/skeleton';
import { useNetworkState } from '@/hooks/useNetworkState';
import { usePayoutBalance } from '../hooks/usePayoutBalance';
import { RequestPayoutForm } from '../components/RequestPayoutForm';
import { AutomaticPayoutInfo } from '../components/AutomaticPayoutInfo';

export default function RequestPayoutPage() {
  const { t } = useTranslation();
  const online = useNetworkState();
  const balance = usePayoutBalance();

  if (!online) {
    return (
      <div className="min-w-0">
        <BackLink to="/payouts" pluralName={t('payouts.backPlural')} />
        <div className="mt-6">
          <OfflineState />
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <BackLink to="/payouts" pluralName={t('payouts.backPlural')} />
      <h1 className="mb-6 mt-3 text-page-title text-foreground">
        {t('payouts.request.title')}
      </h1>

      {balance.isLoading ? (
        <div className="max-w-2xl space-y-4">
          <Skeleton className="h-32 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-24 w-full rounded-md" />
        </div>
      ) : balance.isError || !balance.data ? (
        <ErrorState onRetry={() => balance.refetch()} title={t('common.states.errorTitle')} />
      ) : balance.data.plan === 'auto' ? (
        <AutomaticPayoutInfo nextExpectedAt={balance.data.nextExpectedAt} />
      ) : (
        <RequestPayoutForm balance={balance.data} />
      )}
    </div>
  );
}
