import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface Props {
  /** Whether to render an avatar circle in the identity row. */
  avatar?: boolean;
  /** Number of chip placeholders in the chips row. */
  chips?: number;
  /** Number of tab placeholders in the tab strip. */
  tabs?: number;
  className?: string;
}

/**
 * Layout-mirroring skeleton for §0.5 detail pages: back-link row, identity row
 * (optional avatar + title + subtitle + status pill), chips row, tab strip,
 * and a tab-body content block.
 *
 * Use on the loading state of any /:id detail page so the user sees the page's
 * shape immediately rather than a generic table skeleton.
 */
export function DetailPageSkeleton({
  avatar = true,
  chips = 3,
  tabs = 3,
  className,
}: Props) {
  return (
    <div className={cn('space-y-6', className)} aria-busy="true" aria-live="polite">
      {/* Back-link row */}
      <Skeleton className="h-5 w-40" />

      {/* Identity row */}
      <div className="flex flex-wrap items-center gap-3">
        {avatar ? <Skeleton className="size-12 shrink-0 rounded-full" /> : null}
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-6 w-2/3 max-w-sm" />
          <Skeleton className="h-4 w-1/2 max-w-xs" />
        </div>
        <Skeleton className="h-6 w-20 rounded-md" />
        <Skeleton className="h-6 w-20 rounded-md" />
        <Skeleton className="size-9 rounded-md" />
      </div>

      {/* Chips row */}
      {chips > 0 ? (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: chips }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-32 rounded-md" />
          ))}
        </div>
      ) : null}

      {/* Tab strip */}
      <div
        className="grid gap-1 rounded-md bg-muted/40 p-1"
        style={{ gridTemplateColumns: `repeat(${tabs}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: tabs }).map((_, i) => (
          <Skeleton key={i} className="h-8 rounded-sm" />
        ))}
      </div>

      {/* Body */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-3/4" />
            </div>
          ))}
        </div>
        <Skeleton className="h-9 w-40 rounded-md" />
      </div>
    </div>
  );
}
