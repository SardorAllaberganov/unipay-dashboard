import { Plus, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { WriteButton } from '@/components/unipay/WriteButton';
import { useNetworkState } from '@/hooks/useNetworkState';
import {
  PanelErrorState,
  PanelOfflineNote,
  PanelOfflineState,
  PanelPartialNote,
} from '@/features/dashboard/components/PanelStates';
import { BankAccountCard } from '../components/BankAccountCard';
import { useBankAccounts } from '../hooks/useBankAccounts';

export default function BankAccountsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const query = useBankAccounts();
  const online = useNetworkState();

  const goAdd = () => navigate('/organization/bank-accounts/new');

  // ----- 6 states -----
  if (query.isPending) {
    return <BankAccountsSkeleton />;
  }
  if (query.isError && !query.data) {
    if (!online) return <PanelOfflineState />;
    return <PanelErrorState onRetry={() => query.refetch()} />;
  }
  if (!query.data) {
    return <PanelOfflineState />;
  }

  const accounts = query.data.items;
  const meta = query.data._meta;

  return (
    <div className="space-y-4">
      {!online ? <PanelOfflineNote /> : null}
      {meta?.partial ? (
        <PanelPartialNote shown={meta.shown ?? 0} total={meta.total ?? 0} />
      ) : null}

      {accounts.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={t('organization.bankAccounts.emptyTitle')}
          description={t('organization.bankAccounts.emptyBody')}
          primaryAction={{
            label: t('organization.bankAccounts.addCta'),
            onClick: goAdd,
            icon: Plus,
          }}
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground tabular">
              {t('organization.bankAccounts.countLabel', { count: accounts.length })}
            </p>
            <WriteButton onClick={goAdd}>
              <Plus className="size-4" aria-hidden />
              {t('organization.bankAccounts.addCta')}
            </WriteButton>
          </div>
          <div className="grid gap-4">
            {accounts.map((account) => (
              <BankAccountCard key={account.id} account={account} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function BankAccountsSkeleton() {
  return (
    <div className="grid gap-4">
      {[0, 1].map((i) => (
        <Skeleton key={i} className="h-32 rounded-xl" />
      ))}
    </div>
  );
}
