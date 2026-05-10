import type { ReactNode } from 'react';
import { Inbox, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ActionProps {
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: LucideIcon;
}

interface Props {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  primaryAction?: ActionProps;
  secondaryAction?: ActionProps;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  primaryAction,
  secondaryAction,
  className,
}: Props) {
  return (
    <div
      className={cn(
        'flex w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card px-6 py-12 text-center',
        className
      )}
    >
      <Icon className="size-12 text-muted-foreground" aria-hidden />
      <div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {description ? (
          <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {(primaryAction || secondaryAction) && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          {primaryAction ? (
            <Button onClick={primaryAction.onClick} asChild={!!primaryAction.href}>
              {primaryAction.href ? (
                <a href={primaryAction.href}>
                  {primaryAction.icon ? <primaryAction.icon className="size-4" aria-hidden /> : null}
                  {primaryAction.label}
                </a>
              ) : (
                <>
                  {primaryAction.icon ? <primaryAction.icon className="size-4" aria-hidden /> : null}
                  {primaryAction.label}
                </>
              )}
            </Button>
          ) : null}
          {secondaryAction ? (
            <Button variant="outline" onClick={secondaryAction.onClick} asChild={!!secondaryAction.href}>
              {secondaryAction.href ? (
                <a href={secondaryAction.href}>{secondaryAction.label}</a>
              ) : (
                secondaryAction.label
              )}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
