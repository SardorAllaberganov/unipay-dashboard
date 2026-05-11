// Shared bulk-action bar. Renders fixed at the bottom of the viewport (offset by
// --sidebar-width on md+), only when count > 0. Page wrappers using this must include
// `pb-28` to clear it.
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  count: number;
  onClear: () => void;
  label: string;
  children: ReactNode;
  className?: string;
}

export function BulkActionBar({ count, onClear, label, children, className }: Props) {
  const { t } = useTranslation();
  if (count === 0) return null;
  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card px-4 py-3 md:left-[var(--sidebar-width,4rem)] md:px-6',
        className,
      )}
      role="region"
      aria-label={label}
    >
      <div className="flex flex-wrap items-center gap-2 md:flex-nowrap">
        <div className="flex flex-1 items-center gap-2 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={onClear}
            aria-label={t('common.actions.cancel')}
            className="size-9 shrink-0 p-0"
          >
            <X className="size-4" aria-hidden />
          </Button>
          <p className="truncate text-sm font-medium text-foreground tabular">{label}</p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:flex-nowrap">
          {children}
        </div>
      </div>
    </div>
  );
}
