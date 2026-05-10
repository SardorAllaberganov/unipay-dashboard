import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  breadcrumbs?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ breadcrumbs, title, description, actions, className }: Props) {
  return (
    <div className={cn('mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between', className)}>
      <div className="min-w-0">
        {breadcrumbs ? (
          <div className="mb-2 text-sm text-muted-foreground">{breadcrumbs}</div>
        ) : null}
        <h1 className="text-page-title text-foreground">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
