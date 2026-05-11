// /payments/transactions/:id — full-page detail (Pattern A per §0.5).
// `pb-28` wrapper clears the fixed-bottom action bar.
import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { DetailPageSkeleton } from '@/components/shared/DetailPageSkeleton';
import { ErrorState } from '@/components/shared/ErrorState';
import { useNetworkState } from '@/hooks/useNetworkState';
import { OfflineState } from '@/components/shared/OfflineState';
import { TransactionDetailHeader } from '../components/TransactionDetailHeader';
import { TransactionDetailContent } from '../components/TransactionDetailContent';
import { TransactionDetailActionBar } from '../components/TransactionDetailActionBar';
import { useTransaction } from '../hooks/useTransactions';

export function TransactionDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const online = useNetworkState();
  const query = useTransaction(id);

  const onDownloadReceipt = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }, []);

  if (!online) {
    return (
      <div className="pb-28">
        <OfflineState />
      </div>
    );
  }
  if (query.isLoading) {
    return (
      <div className="pb-28">
        <DetailPageSkeleton avatar chips={2} tabs={0} />
      </div>
    );
  }
  if (query.isError || !query.data) {
    return (
      <div className="pb-28">
        <ErrorState
          onRetry={() => query.refetch()}
          title={t('common.states.errorTitle')}
        />
      </div>
    );
  }
  const tx = query.data;

  return (
    <div className="min-w-0 pb-28">
      <TransactionDetailHeader transaction={tx} />
      <Card className="p-5 md:p-6">
        <TransactionDetailContent transaction={tx} />
      </Card>
      <TransactionDetailActionBar transaction={tx} onDownloadReceipt={onDownloadReceipt} />
    </div>
  );
}
