import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Lock } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
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
  const rows: Array<{ key: string; label: string; value: string; mono?: boolean }> = [
    {
      key: 'bank',
      label: t('organization.bankAccounts.bankLabel'),
      value: account.bankName,
    },
    {
      key: 'mfo',
      label: t('organization.bankAccounts.mfoLabel'),
      value: account.mfo,
      mono: true,
    },
    {
      key: 'account',
      label: t('organization.bankAccounts.accountLabel'),
      value: account.accountNumber,
      mono: true,
    },
    {
      key: 'holder',
      label: t('organization.bankAccounts.holderLabel'),
      value: account.holderName,
    },
  ];

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-muted/30">
      <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-2.5 text-sm text-muted-foreground">
        <Lock className="size-3.5 shrink-0" aria-hidden />
        <span>{t('organization.bankAccounts.immutableNote')}</span>
      </div>
      <ul className="space-y-1 p-2">
        {rows.map((row) => (
          <CopyableRow
            key={row.key}
            label={row.label}
            value={row.value}
            mono={row.mono}
          />
        ))}
      </ul>
    </div>
  );
}

function CopyableRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const onCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        // Fallback for non-secure contexts: textarea + execCommand.
        const el = document.createElement('textarea');
        el.value = value;
        el.setAttribute('readonly', '');
        el.style.position = 'absolute';
        el.style.left = '-9999px';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      setCopied(true);
      if (typeof navigator.vibrate === 'function') {
        navigator.vibrate(10);
      }
      toast.success(t('common.actions.copied'));
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error(t('organization.bankAccounts.copyErrorToast'));
    }
  };

  return (
    <li>
      <button
        type="button"
        onClick={onCopy}
        aria-label={`${t('common.actions.copy')}: ${label}, ${value}`}
        className="group flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-background focus-visible:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:bg-background"
      >
        <div className="min-w-0 flex-1 space-y-1">
          <span className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          <span
            className={`block text-sm font-medium text-foreground ${mono ? 'tabular break-all' : ''}`}
          >
            {value}
          </span>
        </div>
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors group-hover:text-foreground group-active:text-foreground"
          aria-hidden
        >
          {copied ? (
            <Check className="size-4 text-success-700" />
          ) : (
            <Copy className="size-4" />
          )}
        </span>
        <span className="sr-only" role="status" aria-live="polite">
          {copied ? t('common.actions.copied') : ''}
        </span>
      </button>
    </li>
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
