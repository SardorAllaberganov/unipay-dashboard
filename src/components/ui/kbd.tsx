import { cn } from '@/lib/utils';

// Canonical keyboard-shortcut chip — used in command palette, dropdown items, search hint.
// `text-xs` is allowed here per STYLE_DISCIPLINE.md §0.2 (kbd hints).
export function Kbd({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-xs text-muted-foreground',
        className
      )}
      {...props}
    />
  );
}
