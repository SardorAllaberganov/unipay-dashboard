import { Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';

interface Props {
  unreadCount?: number;
}

export function NotificationsBell({ unreadCount = 0 }: Props) {
  const { t } = useTranslation();
  const hasUnread = unreadCount > 0;
  const title = t('notifications.title');
  const ariaLabel = hasUnread
    ? `${title}, ${t('notifications.unreadCount', { count: unreadCount })}`
    : title;

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={ariaLabel} className="relative">
              <Bell className="size-4" aria-hidden />
              {hasUnread ? (
                <span
                  aria-hidden
                  className="absolute right-2 top-2 size-1.5 rounded-full bg-danger-600 ring-2 ring-card"
                />
              ) : null}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>{title}</TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b border-border p-3 text-sm font-medium">{title}</div>
        <div className="p-6 text-center text-sm text-muted-foreground">
          {t('notifications.empty')}
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
