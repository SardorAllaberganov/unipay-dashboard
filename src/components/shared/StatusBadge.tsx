// STYLE_DISCIPLINE.md §0.1 (color tokens) + §0.9 (color paired with icon, never color alone).
// `text-xs` here is allowed per §0.2 (chip body).
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  Lock,
  Minus,
  Undo2,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { TONE, type Tone } from '@/lib/tone';

const VARIANT_TO_TONE: Record<string, Tone> = {
  paid: 'success',
  processing: 'info',
  pending: 'warning',
  overdue: 'danger',
  failed: 'danger',
  refunded: 'refund',
  active: 'success',
  inactive: 'neutral',
  'coming-soon': 'warning',
};

const ICONS: Record<string, LucideIcon> = {
  paid: CheckCircle2,
  processing: Loader2,
  pending: Clock,
  overdue: AlertCircle,
  failed: XCircle,
  refunded: Undo2,
  active: Check,
  inactive: Minus,
  'coming-soon': Lock,
};

export type StatusBadgeVariant =
  | 'paid'
  | 'processing'
  | 'pending'
  | 'overdue'
  | 'failed'
  | 'refunded'
  | 'active'
  | 'inactive'
  | 'coming-soon';

interface Props {
  variant: StatusBadgeVariant;
  label?: string;
  className?: string;
}

export function StatusBadge({ variant, label, className }: Props) {
  const { t } = useTranslation();
  const Icon = ICONS[variant]!;
  const tone = TONE[VARIANT_TO_TONE[variant]!];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium',
        tone.bg,
        tone.fg,
        className
      )}
      role="status"
    >
      <Icon
        className={cn('size-3', variant === 'processing' && 'animate-spin')}
        aria-hidden
      />
      {label ?? t(`status.${variant}`)}
    </span>
  );
}
