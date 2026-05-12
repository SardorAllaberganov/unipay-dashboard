// Horizontal 4-milestone stepper derived from PayoutStatus.
// Domain only has 3 statuses (settled / pending / failed); the 4 milestone labels
// (Created → Processing → Settled → Reconciled) are UI-only and computed here.
// Past markers `text-success-600`, current `text-brand-600 ring-2 ring-brand-600/30`,
// future `text-muted-foreground` with a dashed line to next (per spec).
// Mobile: reflows vertical with the same color treatment.
import { Check, Circle, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { PayoutStatus } from '@/types/domain';

type Milestone = 'created' | 'processing' | 'settled' | 'reconciled';
type MarkerState = 'past' | 'current' | 'future' | 'failed';

const MILESTONES: Milestone[] = ['created', 'processing', 'settled', 'reconciled'];

function computeStates(status: PayoutStatus): Record<Milestone, MarkerState> {
  if (status === 'settled') {
    return {
      created: 'past',
      processing: 'past',
      settled: 'past',
      reconciled: 'current',
    };
  }
  if (status === 'pending') {
    return {
      created: 'past',
      processing: 'current',
      settled: 'future',
      reconciled: 'future',
    };
  }
  // failed — flag the milestone that broke. We surface it at `processing`
  // since that's where bank-side errors land in this fixture.
  return {
    created: 'past',
    processing: 'failed',
    settled: 'future',
    reconciled: 'future',
  };
}

interface Props {
  status: PayoutStatus;
  className?: string;
}

export function StatusTimeline({ status, className }: Props) {
  const { t } = useTranslation();
  const states = computeStates(status);

  return (
    <ol
      className={cn(
        'flex flex-col gap-6 md:flex-row md:items-start md:gap-0',
        className,
      )}
      aria-label={t('payouts.timeline.aria')}
    >
      {MILESTONES.map((m, idx) => {
        const state = states[m];
        const isFirst = idx === 0;
        const isLast = idx === MILESTONES.length - 1;
        // Connector rule: solid iff BOTH endpoints are 'past' (i.e. both done).
        // Any line touching current/future/failed is dashed.
        const prevState = isFirst ? null : states[MILESTONES[idx - 1]!];
        const nextState = isLast ? null : states[MILESTONES[idx + 1]!];
        const leftSolid = prevState === 'past' && state === 'past';
        const rightSolid = state === 'past' && nextState === 'past';

        return (
          <li
            key={m}
            className="relative flex items-start gap-3 md:flex-1 md:flex-col md:items-center md:gap-2"
          >
            {/* Mobile vertical connector — from this marker down to the next. */}
            {!isLast ? (
              <span
                aria-hidden
                className={cn(
                  'absolute left-3.5 top-7 h-6 w-px -translate-x-1/2 md:hidden',
                  rightSolid
                    ? 'border-l border-success-600'
                    : 'border-l border-dashed border-muted-foreground/40',
                )}
              />
            ) : null}

            {/* Desktop horizontal connectors — left half (from prev → this) + right half (from this → next).
                Both halves sit at the marker's vertical center (top-3.5 = 14px = size-7/2) and meet behind
                the marker, which has its own background and naturally occludes the lines. */}
            {!isFirst ? (
              <span
                aria-hidden
                className={cn(
                  'pointer-events-none absolute top-3.5 hidden h-px md:left-0 md:right-1/2 md:block',
                  leftSolid
                    ? 'border-t border-success-600'
                    : 'border-t border-dashed border-muted-foreground/40',
                )}
              />
            ) : null}
            {!isLast ? (
              <span
                aria-hidden
                className={cn(
                  'pointer-events-none absolute top-3.5 hidden h-px md:left-1/2 md:right-0 md:block',
                  rightSolid
                    ? 'border-t border-success-600'
                    : 'border-t border-dashed border-muted-foreground/40',
                )}
              />
            ) : null}

            <Marker state={state} />
            <p
              className={cn(
                'min-w-0 text-sm font-medium md:mt-1 md:text-center',
                state === 'past' && 'text-foreground',
                state === 'current' && 'text-brand-700',
                state === 'failed' && 'text-danger-700',
                state === 'future' && 'text-muted-foreground',
              )}
            >
              {t(`payouts.timeline.${m}`)}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

function Marker({ state }: { state: MarkerState }) {
  // `relative z-10` so the marker renders above the absolute-positioned connector
  // lines that pass through its vertical center.
  const base =
    'relative z-10 inline-flex size-7 shrink-0 items-center justify-center rounded-full';
  if (state === 'failed') {
    return (
      <span className={cn(base, 'bg-danger-50 text-danger-700')} aria-hidden>
        <XCircle className="size-5" />
      </span>
    );
  }
  if (state === 'past') {
    return (
      <span className={cn(base, 'bg-success-600 text-white')} aria-hidden>
        <Check className="size-4" />
      </span>
    );
  }
  if (state === 'current') {
    return (
      <span
        className={cn(base, 'bg-brand-50 text-brand-700 ring-2 ring-brand-600/30')}
        aria-hidden
      >
        <Circle className="size-3 fill-current" />
      </span>
    );
  }
  return (
    <span
      className={cn(
        base,
        'border border-dashed border-muted-foreground/40 bg-card text-muted-foreground',
      )}
      aria-hidden
    >
      <Circle className="size-3" />
    </span>
  );
}
