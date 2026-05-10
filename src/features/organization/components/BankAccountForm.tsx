import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { ResponsiveSheet } from '@/components/shared/ResponsiveSheet';
import { WriteButton } from '@/components/unipay/WriteButton';
import type { BankAccount } from '@/types/domain';
import { bankAccountSchema, type BankAccountValues } from '../schemas';
import { useBankAccountMutations } from '../hooks/useBankAccountMutations';
import { BankImmutableSummary, CurrencyPicker } from './BankAccountFormParts';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: BankAccount;
}

export function BankAccountForm({ open, onOpenChange, account }: Props) {
  const { t } = useTranslation();
  const { update } = useBankAccountMutations();

  const schema = useMemo(() => bankAccountSchema(t), [t]);
  const form = useForm<BankAccountValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      bankCode: '',
      bankName: account.bankName,
      mfo: account.mfo,
      accountNumber: account.accountNumber,
      holderName: account.holderName,
      currency: account.currency,
      label: account.label ?? '',
      isDefault: account.isDefault,
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      bankCode: '',
      bankName: account.bankName,
      mfo: account.mfo,
      accountNumber: account.accountNumber,
      holderName: account.holderName,
      currency: account.currency,
      label: account.label ?? '',
      isDefault: account.isDefault,
    });
  }, [account, open, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await update.mutateAsync({
        id: account.id,
        patch: {
          label: values.label,
          isDefault: values.isDefault,
          // Currency is editable so a user can correct an entry; bank/account/holder remain immutable.
          currency: values.currency,
        },
      });
      toast.success(t('organization.bankAccounts.savedToast'));
      onOpenChange(false);
    } catch {
      toast.error(t('organization.bankAccounts.saveErrorToast'));
    }
  });

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('organization.bankAccounts.editTitle')}
      contentClassName="max-w-xl"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.actions.cancel')}
          </Button>
          <WriteButton
            type="submit"
            form="bank-account-form"
            loading={update.isPending}
          >
            {t('common.actions.save')}
          </WriteButton>
        </>
      }
    >
      <Form {...form}>
        <form id="bank-account-form" onSubmit={onSubmit} className="space-y-4">
          <BankImmutableSummary account={account} />

          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('organization.bankAccounts.currencyLabel')}</FormLabel>
                <FormControl>
                  <CurrencyPicker value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="label"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('organization.bankAccounts.labelLabel')}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t('organization.bankAccounts.labelPlaceholder')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isDefault"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-3">
                <FormLabel className="text-sm font-medium">
                  {t('organization.bankAccounts.defaultLabel')}
                </FormLabel>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </form>
      </Form>
    </ResponsiveSheet>
  );
}
