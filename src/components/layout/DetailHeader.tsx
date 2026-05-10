// STYLE_DISCIPLINE.md §0.5 — back link, identity row, optional chips.
// No sticky. No bg band. No border-b. Header flows inline with the page rhythm.
import type { ReactNode } from 'react';
import { BackLink } from '@/components/shared/BackLink';
import { cn } from '@/lib/utils';
interface Props {
  backTo: string;
  backLabel: string;
  identityLeft: ReactNode;
  identityCenter: ReactNode;
  identityRight?: ReactNode;
  chips?: ReactNode;
  className?: string;
}

export function DetailHeader({
  backTo,
  backLabel,
  identityLeft,
  identityCenter,
  identityRight,
  chips,
  className,
}: Props) {
  return (
    <header className={cn('mb-6 flex flex-col gap-3', className)}>
      <BackLink to={backTo} pluralName={backLabel} />

      <div className="flex flex-wrap items-center gap-3">
        <div className="shrink-0">{identityLeft}</div>
        <div className="min-w-0 flex-1">{identityCenter}</div>
        {identityRight ? (
          <div className="flex flex-wrap items-center gap-2">{identityRight}</div>
        ) : null}
      </div>

      {chips ? <div className="flex flex-wrap gap-2">{chips}</div> : null}
    </header>
  );
}
