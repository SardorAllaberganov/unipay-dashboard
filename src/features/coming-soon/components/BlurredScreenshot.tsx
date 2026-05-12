// Decorative blurred-screenshot placeholder. Used as the headline illustration
// on locked-feature pages + the AI Insights teaser. Rendered as a CSS-only
// composition (no real image) — gradient + grid pattern blurred under a centered
// lucide icon. Purely visual; aria-hidden so screen readers skip it.
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  icon: LucideIcon;
  className?: string;
  /** When true, drops the height to a more compact 140px (used by AIInsightsTeaser). */
  compact?: boolean;
}

export function BlurredScreenshot({ icon: Icon, className, compact }: Props) {
  return (
    <div
      aria-hidden
      className={cn(
        'relative overflow-hidden rounded-lg border border-border bg-muted/30',
        compact ? 'h-[140px]' : 'h-[200px]',
        className,
      )}
    >
      {/* Blurred faux-content layer: gradient + faint grid */}
      <div
        className="absolute inset-0 [filter:blur(6px)]"
        style={{
          backgroundImage:
            'linear-gradient(135deg, hsl(var(--brand-50)) 0%, hsl(var(--muted)) 100%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-40 [filter:blur(6px)]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, hsl(var(--border)) 0 1px, transparent 1px 24px), repeating-linear-gradient(90deg, hsl(var(--border)) 0 1px, transparent 1px 24px)',
        }}
      />
      {/* Centered icon overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="inline-flex size-16 items-center justify-center rounded-full bg-card/80 text-brand-600 backdrop-blur-sm dark:bg-card/60 dark:text-brand-400">
          <Icon className="size-8" aria-hidden />
        </div>
      </div>
    </div>
  );
}
