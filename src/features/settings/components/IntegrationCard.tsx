// Disabled integration card. Routes to /locked/integrations-:slug for the
// full Coming Soon landing. The card itself is visually muted but the CTA stays
// interactive (`Link` underneath the Button).
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';

interface Props {
  /** kebab-case slug used to compose the /locked/integrations-:slug route. */
  slug: 'hemis' | '1c' | 'custom';
  icon: LucideIcon;
  /** Trade name shown as the card title. Plain string — not keyed because brand names. */
  name: string;
  /** i18n key for the one-line description. */
  descriptionKey: string;
}

export function IntegrationCard({ slug, icon: Icon, name, descriptionKey }: Props) {
  const { t } = useTranslation();
  return (
    <Card className="flex flex-col gap-3 opacity-80">
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="inline-flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="size-5" aria-hidden />
          </div>
          <StatusBadge variant="coming-soon" label={t('comingSoon.badge')} />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-foreground">{name}</h3>
          <p className="text-sm text-muted-foreground">{t(descriptionKey)}</p>
        </div>
        <Button asChild variant="outline" className="self-start">
          <Link to={`/locked/integrations-${slug}`}>
            {t('settings.integrations.requestAccess')}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
