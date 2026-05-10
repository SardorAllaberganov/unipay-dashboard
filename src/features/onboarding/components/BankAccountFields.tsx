import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { BankCombobox } from './BankCombobox';
import type { Step3Values } from '../schemas';

interface Props {
  index: number;
  onRemove: () => void;
  canRemove: boolean;
  onSetDefault: (index: number) => void;
}

export function BankAccountFields({ index, onRemove, canRemove, onSetDefault }: Props) {
  const { t } = useTranslation();
  const form = useFormContext<Step3Values>();

  return (
    <div className="space-y-4 rounded-lg border border-border p-5">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {t('onboarding.bank.accountTitle', { num: index + 1 })}
        </div>
        {canRemove ? (
          <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
            <Trash2 className="size-4" aria-hidden />
            {t('common.actions.delete')}
          </Button>
        ) : null}
      </div>

      <FormField
        control={form.control}
        name={`accounts.${index}.bankCode`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('onboarding.bank.bankNameLabel')}</FormLabel>
            <FormControl>
              <BankCombobox
                value={field.value}
                onChange={(bank) => {
                  field.onChange(bank.code);
                  form.setValue(`accounts.${index}.bankName`, bank.name, { shouldValidate: true });
                  form.setValue(`accounts.${index}.mfo`, bank.mfo, { shouldValidate: true });
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name={`accounts.${index}.mfo`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('onboarding.bank.mfoLabel')}</FormLabel>
              <FormControl>
                <Input {...field} maxLength={5} inputMode="numeric" readOnly />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`accounts.${index}.iban`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('onboarding.bank.ibanLabel')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  maxLength={20}
                  inputMode="numeric"
                  className="tabular"
                  onChange={(e) => field.onChange(e.target.value.replace(/\D/g, '').slice(0, 20))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name={`accounts.${index}.holderName`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('onboarding.bank.holderLabel')}</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`accounts.${index}.label`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('onboarding.bank.labelLabel')}</FormLabel>
            <FormControl>
              <Input {...field} placeholder={t('onboarding.bank.labelPlaceholder')} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="space-y-2">
        <Label>{t('onboarding.bank.currencyLabel')}</Label>
        <Controller
          control={form.control}
          name={`accounts.${index}.currency`}
          render={({ field }) => (
            <RadioGroup value={field.value} onValueChange={field.onChange} className="flex gap-4">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="UZS" id={`currency-uzs-${index}`} />
                <Label htmlFor={`currency-uzs-${index}`} className="cursor-pointer font-normal">
                  UZS
                </Label>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex cursor-not-allowed items-center gap-2 opacity-50">
                    <RadioGroupItem value="USD" id={`currency-usd-${index}`} disabled />
                    <Label htmlFor={`currency-usd-${index}`} className="font-normal">
                      USD
                    </Label>
                  </div>
                </TooltipTrigger>
                <TooltipContent>{t('onboarding.bank.usdComingSoon')}</TooltipContent>
              </Tooltip>
            </RadioGroup>
          )}
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id={`isDefault-${index}`}
          checked={form.watch(`accounts.${index}.isDefault`)}
          onCheckedChange={() => onSetDefault(index)}
        />
        <Label htmlFor={`isDefault-${index}`} className="cursor-pointer font-normal">
          {t('onboarding.bank.isDefault')}
        </Label>
      </div>
    </div>
  );
}
