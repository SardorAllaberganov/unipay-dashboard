import { useMemo } from 'react';
import { RotateCw, WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useNetworkState } from '@/hooks/useNetworkState';
import { cn } from '@/lib/utils';

interface Props {
  forceVisible?: boolean;
}

export function OfflineBanner({ forceVisible }: Props) {
  const { t } = useTranslation();
  const online = useNetworkState();

  // Capture cached-from time once at first mount; don't tick every render.
  const cachedFrom = useMemo(() => format(new Date(), 'HH:mm'), []);

  if (online && !forceVisible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex items-center gap-3 border-b border-border bg-slate-100 px-4 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300 md:px-6'
      )}
    >
      <WifiOff className="size-4 shrink-0" aria-hidden />
      <span className="flex-1 truncate">
        {t('system.offline.banner', { time: cachedFrom })}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => window.location.reload()}
        className="h-7 gap-1.5"
      >
        <RotateCw className="size-3.5" aria-hidden />
        {t('common.actions.retry')}
      </Button>
    </div>
  );
}
