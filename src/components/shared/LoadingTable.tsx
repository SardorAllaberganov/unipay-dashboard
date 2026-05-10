import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface Props {
  rows?: number;
  columns?: number;
  className?: string;
}

export function LoadingTable({ rows = 6, columns = 5, className }: Props) {
  return (
    <div
      className={cn('overflow-hidden rounded-lg border border-border bg-card', className)}
      aria-busy="true"
      aria-label="Загрузка таблицы"
    >
      <div className="grid border-b bg-muted/20 px-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="py-3 pr-4">
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={r}
            className="grid px-4"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: columns }).map((__, c) => (
              <div key={c} className="py-4 pr-4">
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
