import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
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
import { BackLink } from '@/components/shared/BackLink';
import { WriteButton } from '@/components/unipay/WriteButton';
import { bankAccountSchema, type BankAccountValues } from '../schemas';
import { useBankAccountMutations } from '../hooks/useBankAccountMutations';
import {
  BankPickerFields,
  CurrencyPicker,
} from '../components/BankAccountFormParts';

export default function AddBankAccountPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { create } = useBankAccountMutations();

  const schema = useMemo(() => bankAccountSchema(t), [t]);
  const form = useForm<BankAccountValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      bankCode: '',
      bankName: '',
      mfo: '',
      accountNumber: '',
      holderName: '',
      currency: 'UZS',
      label: '',
      isDefault: false,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await create.mutateAsync({
        bankName: values.bankName,
        mfo: values.mfo,
        accountNumber: values.accountNumber,
        holderName: values.holderName,
        currency: values.currency,
        label: values.label,
        isDefault: values.isDefault,
      });
      toast.success(t('organization.bankAccounts.createdToast'));
      navigate('/organization/bank-accounts');
    } catch {
      toast.error(t('organization.bankAccounts.saveErrorToast'));
    }
  });

  return (
    <div className="space-y-6 pb-28">
      <BackLink
        to="/organization/bank-accounts"
        pluralName={t('organization.bankAccounts.backPlural')}
      />

      <header>
        <h1 className="text-page-title">
          {t('organization.bankAccounts.addPageTitle')}
        </h1>
      </header>

      <Form {...form}>
        <form
          id="add-bank-account-form"
          onSubmit={onSubmit}
          className="max-w-2xl space-y-4"
        >
          <BankPickerFields form={form} />

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

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card px-4 py-3 md:left-[var(--sidebar-width,4rem)] md:px-6">
        <div className="mx-auto flex w-full max-w-2xl gap-2 md:justify-end">
          <Button
            type="button"
            variant="outline"
            className="flex-1 md:flex-none"
            onClick={() => navigate('/organization/bank-accounts')}
          >
            {t('common.actions.cancel')}
          </Button>
          <WriteButton
            type="submit"
            form="add-bank-account-form"
            loading={create.isPending}
            className="flex-1 md:flex-none"
          >
            {t('common.actions.save')}
          </WriteButton>
        </div>
      </div>
    </div>
  );
}
