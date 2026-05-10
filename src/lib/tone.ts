// STYLE_DISCIPLINE.md §0.1 — single source of truth for tone-to-class mapping.
// Components that need a "tone" (success / warning / danger / info / refund / neutral / brand)
// must read from here, never hardcode bg/fg/ring classes.

export type Tone =
  | 'brand'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'refund'
  | 'neutral';

interface ToneClasses {
  bg: string;
  fg: string;
  ring: string;
  iconColor: string;
}

export const TONE: Record<Tone, ToneClasses> = {
  brand: {
    bg: 'bg-primary-light',
    fg: 'text-primary',
    ring: 'ring-primary/20',
    iconColor: 'text-primary',
  },
  success: {
    bg: 'bg-success-light',
    fg: 'text-success-foreground',
    ring: 'ring-success/20',
    iconColor: 'text-success',
  },
  warning: {
    bg: 'bg-warning-light',
    fg: 'text-warning-foreground',
    ring: 'ring-warning/20',
    iconColor: 'text-warning',
  },
  danger: {
    bg: 'bg-danger-light',
    fg: 'text-danger-foreground',
    ring: 'ring-danger/20',
    iconColor: 'text-danger',
  },
  info: {
    bg: 'bg-info-light',
    fg: 'text-primary',
    ring: 'ring-primary/20',
    iconColor: 'text-primary',
  },
  refund: {
    bg: 'bg-refund-light',
    fg: 'text-refund',
    ring: 'ring-refund/20',
    iconColor: 'text-refund',
  },
  neutral: {
    bg: 'bg-surface-2',
    fg: 'text-muted-foreground',
    ring: 'ring-border',
    iconColor: 'text-muted-foreground',
  },
};

export function toneClasses(tone: Tone): ToneClasses {
  return TONE[tone];
}
