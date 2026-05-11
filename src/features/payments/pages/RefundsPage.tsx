// /payments/refunds — two stacked sections (pending requests + history). Each is a separate
// data surface with its own 6 states.
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/layout/PageHeader';
import { useNetworkState } from '@/hooks/useNetworkState';
import { RefundsTable } from '../components/RefundsTable';
import { useRefunds } from '../hooks/useRefunds';

export function RefundsPage() {
  const { t } = useTranslation();
  const online = useNetworkState();
  const pending = useRefunds('pending');
  const history = useRefunds('history');

  const pendingState: 'loading' | 'empty' | 'error' | 'offline' | 'partial' | 'data' = !online
    ? 'offline'
    : pending.isLoading
      ? 'loading'
      : pending.isError
        ? 'error'
        : (pending.data?.items.length ?? 0) === 0
          ? 'empty'
          : 'data';

  const historyState: 'loading' | 'empty' | 'error' | 'offline' | 'partial' | 'data' = !online
    ? 'offline'
    : history.isLoading
      ? 'loading'
      : history.isError
        ? 'error'
        : (history.data?.items.length ?? 0) === 0
          ? 'empty'
          : 'data';

  return (
    <div className="space-y-8">
      <PageHeader title={t('payments.refunds.title')} />

      <section className="space-y-3">
        <div className="space-y-0.5">
          <h2 className="text-lg font-semibold text-foreground">
            {t('payments.refunds.sections.pendingTitle')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('payments.refunds.sections.pendingBody')}
          </p>
        </div>
        <RefundsTable
          mode="pending"
          data={pending.data?.items ?? []}
          state={pendingState}
          onRetry={() => pending.refetch()}
        />
      </section>

      <section className="space-y-3">
        <div className="space-y-0.5">
          <h2 className="text-lg font-semibold text-foreground">
            {t('payments.refunds.sections.historyTitle')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('payments.refunds.sections.historyBody')}
          </p>
        </div>
        <RefundsTable
          mode="history"
          data={history.data?.items ?? []}
          state={historyState}
          onRetry={() => history.refetch()}
        />
      </section>
    </div>
  );
}
