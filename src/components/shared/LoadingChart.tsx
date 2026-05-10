import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Props {
  height?: number;
  className?: string;
  title?: boolean;
}

export function LoadingChart({ height = 240, className, title = true }: Props) {
  return (
    <Card className={cn('p-4', className)} aria-busy="true" aria-label="Загрузка графика">
      {title ? (
        <div className="mb-4 space-y-2">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      ) : null}
      <div className="flex items-end gap-2" style={{ height }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1"
            style={{ height: `${30 + ((i * 17) % 60)}%` }}
          />
        ))}
      </div>
    </Card>
  );
}
