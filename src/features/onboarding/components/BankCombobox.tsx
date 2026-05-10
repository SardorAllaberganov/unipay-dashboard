import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { UZ_BANKS, type UzBank } from '../fixtures/uzBanks';
import { cn } from '@/lib/utils';

interface Props {
  value: string;
  onChange: (bank: UzBank) => void;
}

export function BankCombobox({ value, onChange }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const selected = UZ_BANKS.find((b) => b.code === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {selected ? selected.name : t('onboarding.bank.selectPlaceholder')}
          <ChevronsUpDown className="size-4 opacity-50" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder={t('onboarding.bank.searchPlaceholder')} />
          <CommandList>
            <CommandEmpty>{t('onboarding.bank.notFound')}</CommandEmpty>
            <CommandGroup>
              {UZ_BANKS.map((b) => (
                <CommandItem
                  key={b.code}
                  value={b.name}
                  onSelect={() => {
                    onChange(b);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 size-4',
                      value === b.code ? 'opacity-100' : 'opacity-0'
                    )}
                    aria-hidden
                  />
                  {b.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
