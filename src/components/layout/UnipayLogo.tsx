import { cn } from '@/lib/utils';

interface Props {
  collapsed?: boolean;
  className?: string;
}

export function UnipayLogo({ collapsed, className }: Props) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/20">
        <span className="text-sm font-bold tracking-tight">UP</span>
      </div>
      {!collapsed ? (
        <span className="text-base font-semibold tracking-tight text-foreground">UNIPAY</span>
      ) : null}
    </div>
  );
}
