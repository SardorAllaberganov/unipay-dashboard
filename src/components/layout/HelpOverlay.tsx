import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Kbd } from '@/components/ui/kbd';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SHORTCUTS, SHORTCUT_GROUPS, type Shortcut } from './shortcuts';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HelpOverlay({ open, onOpenChange }: Props) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-[640px] overflow-hidden p-0">
        <DialogHeader className="border-b border-border p-5">
          <DialogTitle>{t('common.actions.shortcuts')}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] p-5">
          <div className="space-y-6">
            {SHORTCUT_GROUPS.map((group) => {
              const items = SHORTCUTS.filter((s) => s.group === group.id);
              if (items.length === 0) return null;
              return (
                <section key={group.id}>
                  <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t(group.titleKey)}
                  </div>
                  <ul className="space-y-1.5">
                    {items.map((s) => (
                      <Row key={s.id} shortcut={s} label={t(s.labelKey)} />
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function Row({ shortcut, label }: { shortcut: Shortcut; label: string }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-md px-3 py-2 hover:bg-muted/40">
      <span className="text-sm">{label}</span>
      <span className="flex items-center gap-1">
        {shortcut.keys.map((k, i) => (
          <Kbd key={i}>{k}</Kbd>
        ))}
      </span>
    </li>
  );
}
