// Static registry for the 9 Phase-2 features that ship as Coming Soon landings.
// Content (title / subtitle / bullets) is keyed via i18n so RU+UZ stay in sync.
// `icon` defaults to `Construction`; per-feature overrides expressed as a lucide
// import here so the page can render distinct illustrations without bloating
// each route.
import type { LucideIcon } from 'lucide-react';
import {
  Bot,
  Construction,
  FileText,
  Globe2,
  KeyRound,
  Link2,
  MessageSquare,
  Smartphone,
  Sparkles,
} from 'lucide-react';

export interface FeatureLockedContent {
  /** URL slug (kebab-case). Used as both the route param and the i18n sub-key. */
  slug: string;
  /** Lucide icon used in the illustration when no blurred screenshot is provided. */
  icon: LucideIcon;
  /**
   * Optional contact-sales mailto subject. If unset, defaults to
   * "Plan upgrade request" — the generic mailto: subject.
   */
  contactSubject?: string;
  /** When true, the page renders a `<BlurredScreenshot>` placeholder above the EmptyState. */
  showBlurredPreview?: boolean;
}

export const FEATURE_REGISTRY: Record<string, FeatureLockedContent> = {
  'sms-campaigns': {
    slug: 'sms-campaigns',
    icon: MessageSquare,
    contactSubject: 'SMS Campaigns — early access',
    showBlurredPreview: true,
  },
  documents: {
    slug: 'documents',
    icon: FileText,
    contactSubject: 'Documents module — early access',
    showBlurredPreview: true,
  },
  'ai-insights': {
    slug: 'ai-insights',
    icon: Bot,
    contactSubject: 'AI Insights — early access',
    showBlurredPreview: true,
  },
  'integrations-hemis': {
    slug: 'integrations-hemis',
    icon: Link2,
    contactSubject: 'HEMIS integration — request access',
  },
  'integrations-1c': {
    slug: 'integrations-1c',
    icon: Link2,
    contactSubject: '1C integration — request access',
  },
  'mobile-app': {
    slug: 'mobile-app',
    icon: Smartphone,
    contactSubject: 'Mobile app — early access',
  },
  'multi-currency': {
    slug: 'multi-currency',
    icon: Globe2,
    contactSubject: 'Multi-currency — early access',
  },
  'custom-roles': {
    slug: 'custom-roles',
    icon: KeyRound,
    contactSubject: 'Custom roles — early access',
  },
  'billing-upgrade': {
    slug: 'billing-upgrade',
    icon: Sparkles,
    contactSubject: 'Plan upgrade request',
  },
};

/** Fallback used when a slug isn't in the registry. */
export const FALLBACK_FEATURE: FeatureLockedContent = {
  slug: 'fallback',
  icon: Construction,
};

/** Resolves a slug to a registry entry, falling back to the generic shape. */
export function resolveFeature(slug: string | undefined): FeatureLockedContent {
  if (!slug) return FALLBACK_FEATURE;
  return FEATURE_REGISTRY[slug] ?? FALLBACK_FEATURE;
}

/**
 * Bullet count is fixed at 3 per the spec — the i18n payload for every feature
 * uses array indices 0..2 under `comingSoon.features.<slug>.bullets`.
 */
export const BULLET_COUNT = 3;

/** Support address — single source of truth, swap when sales gets its own queue. */
export const SUPPORT_EMAIL = 'support@unipay.uz';
