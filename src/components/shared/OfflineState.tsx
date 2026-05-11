import { WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface Props {
  title?: string;
  description?: string;
  cachedNote?: ReactNode;
  className?: string;
}

export function OfflineState({ title, description, cachedNote, className }: Props) {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      className={cn(
        'flex w-full flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card px-6 py-10 text-center',
        className
      )}
    >
      <WifiOff className="size-10 text-muted-foreground" aria-hidden />
      <div>
        <h3 className="text-lg font-semibold text-foreground">{title ?? t('system.offline.title')}</h3>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          {description ?? t('system.offline.body')}
        </p>
      </div>
      {cachedNote ? <div className="text-sm text-muted-foreground">{cachedNote}</div> : null}
    </div>
  );
}
