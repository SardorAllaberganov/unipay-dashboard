import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Props {
  lines?: number;
  className?: string;
}

export function LoadingCard({ lines = 3, className }: Props) {
  return (
    <Card className={cn('p-4 md:p-5', className)} aria-busy="true" aria-label="Загрузка карточки">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="mt-3 h-8 w-2/3" />
      <div className="mt-4 space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-full" />
        ))}
      </div>
    </Card>
  );
}
