import { Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';

export function NotificationsBell() {
  const { t } = useTranslation();
  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Уведомления" className="relative">
              <Bell className="size-4" aria-hidden />
              <span
                aria-hidden
                className="absolute right-1.5 top-1.5 size-2 rounded-full bg-danger-600 ring-2 ring-card"
              />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Уведомления</TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b border-border p-3 text-sm font-medium">Уведомления</div>
        <div className="p-6 text-center text-sm text-muted-foreground">
          {t('common.states.noResults')}
        </div>
        <Separator />
        <button
          type="button"
          className="w-full p-3 text-center text-sm text-primary hover:bg-muted/40"
        >
          {t('common.actions.viewAll')}
        </button>
      </PopoverContent>
    </Popover>
  );
}
