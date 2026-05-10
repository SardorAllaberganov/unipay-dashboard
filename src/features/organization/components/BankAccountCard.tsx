import { useState } from 'react';
import { Building2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MaskedAccount } from '@/components/unipay/MaskedAccount';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { WriteButton } from '@/components/unipay/WriteButton';
import type { BankAccount } from '@/types/domain';
import { useBankAccountMutations } from '../hooks/useBankAccountMutations';
import { BankAccountForm } from './BankAccountForm';

interface Props {
  account: BankAccount;
}

export function BankAccountCard({ account }: Props) {
  const { t } = useTranslation();
  const { remove, setDefault } = useBankAccountMutations();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const onDelete = async (reason?: string) => {
    try {
      await remove.mutateAsync(account.id);
      toast.success(t('organization.bankAccounts.deletedToast'));
      setDeleteOpen(false);
    } catch {
      toast.error(t('organization.bankAccounts.deleteErrorToast'));
    }
    void reason;
  };

  const onSetDefault = async () => {
    try {
      await setDefault.mutateAsync(account.id);
      toast.success(t('organization.bankAccounts.defaultSetToast'));
    } catch {
      toast.error(t('organization.bankAccounts.defaultErrorToast'));
    }
  };

  return (
    <>
      <Card className="overflow-hidden">
        <div className="space-y-3 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                <Building2 className="size-5" aria-hidden />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium text-foreground">{account.bankName}</div>
                <MaskedAccount value={account.accountNumber} />
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  {account.label ? <span>{account.label}</span> : null}
                  <span className="tabular">{account.currency}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {account.isDefault ? (
                <StatusBadge
                  variant="active"
                  label={t('organization.bankAccounts.defaultBadge')}
                />
              ) : null}
              <VerificationBadge verification={account.verification} />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-muted/30 px-5 py-3">
          {!account.isDefault && account.verification === 'verified' ? (
            <WriteButton
              variant="outline"
              size="sm"
              onClick={onSetDefault}
              loading={setDefault.isPending}
            >
              {t('organization.bankAccounts.setDefaultCta')}
            </WriteButton>
          ) : null}
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            {t('common.actions.edit')}
          </Button>
          <WriteButton
            variant="destructive"
            size="sm"
            onClick={() => setDeleteOpen(true)}
          >
            {t('common.actions.delete')}
          </WriteButton>
        </div>
      </Card>

      <BankAccountForm
        open={editOpen}
        onOpenChange={setEditOpen}
        account={account}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t('organization.bankAccounts.deleteTitle')}
        description={t('organization.bankAccounts.deleteBody', {
          bank: account.bankName,
        })}
        destructive
        requireReason
        loading={remove.isPending}
        onConfirm={onDelete}
        confirmLabel={t('common.actions.delete')}
      />
    </>
  );
}

function VerificationBadge({
  verification,
}: {
  verification: BankAccount['verification'];
}) {
  const { t } = useTranslation();
  if (verification === 'verified') {
    return (
      <StatusBadge
        variant="paid"
        label={t('organization.bankAccounts.verificationVerified')}
      />
    );
  }
  if (verification === 'pending') {
    return (
      <StatusBadge
        variant="pending"
        label={t('organization.bankAccounts.verificationPending')}
      />
    );
  }
  return (
    <StatusBadge
      variant="failed"
      label={t('organization.bankAccounts.verificationFailed')}
    />
  );
}
