// `/locked/:feature` — slug-driven Coming Soon landing.
//
// Layout: <LockedLayout> wraps the page in a full-bleed radial-gradient
// background. Content is centered max-w-3xl. Shape mirrors §0.11 <EmptyState>:
//   ┌─────────────────────────┐
//   │ [Coming Soon badge]      │
//   │ [Blurred screenshot OR   │
//   │  large icon, optional]   │
//   │ Title (xl+)              │
//   │ Subtitle (md text)       │
//   │ • bullet 1 (Check icon)  │
//   │ • bullet 2 (Check icon)  │
//   │ • bullet 3 (Check icon)  │
//   │ [Notify Me form ]        │
//   │ Contact sales link       │
//   └─────────────────────────┘
//
// Unknown slugs fall back to a generic "Скоро" copy with no per-feature bullets.
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { LockedLayout } from '@/app/layouts/LockedLayout';
import { NotifyMeForm } from '../components/NotifyMeForm';
import { BlurredScreenshot } from '../components/BlurredScreenshot';
import {
  BULLET_COUNT,
  FEATURE_REGISTRY,
  SUPPORT_EMAIL,
  resolveFeature,
} from '../data/featureContent';

export default function LockedFeaturePage() {
  const { t } = useTranslation();
  const { feature } = useParams<{ feature: string }>();
  const isKnown = !!feature && feature in FEATURE_REGISTRY;
  const cfg = resolveFeature(feature);

  // Content lookup. Known slugs read from `comingSoon.features.<slug>.*`;
  // unknown slugs use `comingSoon.fallback.*` so a typo doesn't render raw key
  // paths.
  const contentBase = isKnown ? `comingSoon.features.${cfg.slug}` : 'comingSoon.fallback';
  const title = t(`${contentBase}.title`);
  const subtitle = t(`${contentBase}.subtitle`);
  const bullets: string[] = [];
  for (let i = 0; i < BULLET_COUNT; i++) {
    bullets.push(t(`${contentBase}.bullets.${i}`));
  }

  const Icon = cfg.icon;
  const contactSubject = encodeURIComponent(cfg.contactSubject ?? 'UNIPAY — sales inquiry');
  const contactHref = `mailto:${SUPPORT_EMAIL}?subject=${contactSubject}`;

  return (
    <LockedLayout>
      <article className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 rounded-xl border border-border bg-card p-6 shadow-sm md:p-10">
        <StatusBadge variant="coming-soon" label={t('comingSoon.badge')} />

        {cfg.showBlurredPreview ? (
          <BlurredScreenshot icon={Icon} className="w-full" />
        ) : (
          <div className="inline-flex size-24 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
            <Icon className="size-12" aria-hidden />
          </div>
        )}

        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-foreground md:text-3xl">{title}</h1>
          <p className="mx-auto max-w-lg text-base text-muted-foreground">{subtitle}</p>
        </div>

        <ul className="w-full max-w-md space-y-2">
          {bullets.map((bullet, i) => (
            <li
              key={i}
              className="flex items-start gap-2.5 rounded-md bg-muted/30 px-3 py-2"
            >
              <Check
                className="mt-0.5 size-4 shrink-0 text-success-700"
                aria-hidden
              />
              <span className="text-sm text-foreground">{bullet}</span>
            </li>
          ))}
        </ul>

        <div className="w-full max-w-md">
          <NotifyMeForm feature={cfg.slug} />
        </div>

        <a
          href={contactHref}
          className="text-sm font-medium text-brand-700 hover:text-brand-800 hover:underline dark:text-brand-300"
        >
          {t('comingSoon.notifyMe.contactSales')}
        </a>
      </article>
    </LockedLayout>
  );
}
