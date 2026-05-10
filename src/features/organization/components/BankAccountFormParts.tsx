import { Lock } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { BankCombobox } from '@/features/onboarding/components/BankCombobox';
import type { BankAccount } from '@/types/domain';
import type { BankAccountValues } from '../schemas';

export function BankImmutableSummary({ account }: { account: BankAccount }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3 text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Lock className="size-3.5" aria-hidden />
        <span>{t('organization.bankAccounts.immutableNote')}</span>
      </div>
      <dl className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="text-muted-foreground">{t('organization.bankAccounts.bankLabel')}</dt>
        <dd>{account.bankName}</dd>
        <dt className="text-muted-foreground">{t('organization.bankAccounts.mfoLabel')}</dt>
        <dd className="tabular">{account.mfo}</dd>
        <dt className="text-muted-foreground">{t('organization.bankAccounts.accountLabel')}</dt>
        <dd className="tabular">{account.accountNumber}</dd>
        <dt className="text-muted-foreground">{t('organization.bankAccounts.holderLabel')}</dt>
        <dd>{account.holderName}</dd>
      </dl>
    </div>
  );
}

export function BankPickerFields({
  form,
}: {
  form: UseFormReturn<BankAccountValues>;
}) {
  const { t } = useTranslation();
  return (
    <>
      <FormField
        control={form.control}
        name="bankCode"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('organization.bankAccounts.bankLabel')}</FormLabel>
            <FormControl>
              <BankCombobox
                value={field.value}
                onChange={(bank) => {
                  field.onChange(bank.code);
                  form.setValue('bankName', bank.name, { shouldValidate: true });
                  form.setValue('mfo', bank.mfo, { shouldValidate: true });
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="mfo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('organization.bankAccounts.mfoLabel')}</FormLabel>
              <FormControl>
                <Input {...field} readOnly className="tabular" inputMode="numeric" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="holderName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('organization.bankAccounts.holderLabel')}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="accountNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('organization.bankAccounts.accountLabel')}</FormLabel>
            <FormControl>
              <Input
                {...field}
                maxLength={20}
                inputMode="numeric"
                className="tabular"
                onChange={(e) =>
                  field.onChange(e.target.value.replace(/\D/g, '').slice(0, 20))
                }
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}

export function CurrencyPicker({
  value,
  onChange,
}: {
  value: 'UZS' | 'USD';
  onChange: (v: 'UZS' | 'USD') => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant={value === 'UZS' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onChange('UZS')}
      >
        UZS
      </Button>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <Button type="button" variant="outline" size="sm" disabled>
              USD
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>{t('organization.bankAccounts.usdComingSoon')}</TooltipContent>
      </Tooltip>
    </div>
  );
}
