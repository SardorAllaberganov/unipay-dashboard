// Horizontal timeline rendered from Transaction.events. Each step renders a circle on
// a connector line, with label + time below. Past = solid `success-600` (`destructive`
// for `failed`); upcoming = hollow gray ring with dashed connector.
// Status-machine awareness per .claude/rules/status-machines.md.
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/lib/format';
import type { TransactionEvent, TransactionEventType } from '@/types/domain';

interface Props {
  events: TransactionEvent[];
  // If the tx is still in flight (status processing/pending), show remaining states as hollow.
  upcomingTypes?: TransactionEventType[];
  className?: string;
}

interface Step {
  type: TransactionEventType;
  at: string | null;
  isPast: boolean;
  isFailed: boolean;
}

export function TransactionTimeline({ events, upcomingTypes = [], className }: Props) {
  const { t } = useTranslation();

  const passedTypes = new Set(events.map((e) => e.type));
  const upcoming = upcomingTypes.filter((tp) => !passedTypes.has(tp));

  const steps: Step[] = [
    ...events.map<Step>((e) => ({
      type: e.type,
      at: e.at,
      isPast: true,
      isFailed: e.type === 'failed',
    })),
    ...upcoming.map<Step>((tp) => ({ type: tp, at: null, isPast: false, isFailed: false })),
  ];

  function lineClass(s: Step): string {
    if (s.isFailed) return 'bg-destructive';
    if (s.isPast) return 'bg-success-600';
    return 'bg-muted-foreground/20';
  }

  return (
    <ol className={cn('flex w-full items-start', className)}>
      {steps.map((step, i) => {
        // Edge-to-edge line: first step's left half follows the first step's status; last
        // step's right half follows the last step's status. Middle joins use the previous
        // step's status on the left, this step's status on the right (so the colored span
        // grows step-by-step left → right as events complete).
        const leftRef = i === 0 ? step : steps[i - 1]!;
        const rightRef = step;

        const circleClass = step.isFailed
          ? 'bg-destructive border-destructive'
          : step.isPast
            ? 'bg-success-600 border-success-600'
            : 'bg-background border-muted-foreground/40';

        return (
          <li
            key={`${step.type}-${i}`}
            className="flex min-w-0 flex-1 flex-col items-center"
          >
            <div className="flex w-full items-center">
              <span className={cn('h-[3px] flex-1', lineClass(leftRef))} aria-hidden />
              <span
                className={cn('size-3.5 shrink-0 rounded-full border-2', circleClass)}
                aria-hidden
              />
              <span className={cn('h-[3px] flex-1', lineClass(rightRef))} aria-hidden />
            </div>
            <div className="mt-3 flex flex-col items-center gap-0.5 px-1 text-center">
              <p
                className={cn(
                  'text-sm font-medium',
                  step.isPast ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {t(`payments.detail.events.${step.type}`)}
              </p>
              {step.at ? (
                <p className="text-xs tabular text-muted-foreground">
                  {formatDateTime(step.at)}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
