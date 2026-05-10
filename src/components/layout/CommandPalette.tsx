import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Monitor, Moon, Sun } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { useTheme } from '@/providers/ThemeProvider';
import { SHORTCUTS } from './shortcuts';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setTheme } = useTheme();

  const close = () => onOpenChange(false);

  const navigateItems = SHORTCUTS.filter((s) => s.group === 'navigate' && s.to);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder={t('common.actions.search') + '…'} />
      <CommandList>
        <CommandEmpty>{t('common.states.noResults')}</CommandEmpty>

        <CommandGroup heading={t('nav.section.main')}>
          {navigateItems.map((s) => (
            <CommandItem
              key={s.id}
              value={t(s.labelKey)}
              onSelect={() => {
                navigate(s.to!);
                close();
              }}
            >
              {t(s.labelKey)}
              <CommandShortcut>{s.keys.join(' ')}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading={t('common.actions.toggleTheme')}>
          <CommandItem
            value="light"
            onSelect={() => {
              setTheme('light');
              close();
            }}
          >
            <Sun className="size-4" aria-hidden />
            Светлая
          </CommandItem>
          <CommandItem
            value="dark"
            onSelect={() => {
              setTheme('dark');
              close();
            }}
          >
            <Moon className="size-4" aria-hidden />
            Тёмная
          </CommandItem>
          <CommandItem
            value="system"
            onSelect={() => {
              setTheme('system');
              close();
            }}
          >
            <Monitor className="size-4" aria-hidden />
            Системная
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
