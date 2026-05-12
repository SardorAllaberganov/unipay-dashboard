// Dashboard teaser for the AI Insights feature. Rendered as a Card with the
// inner content dimmed + non-interactive (`opacity-60 pointer-events-none`) and
// the "Notify me" CTA escaping the dim via `pointer-events-auto`. Click takes
// the user to `/locked/ai-insights` for the full landing.
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bot, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { BlurredScreenshot } from './BlurredScreenshot';

export function AIInsightsTeaser() {
  const { t } = useTranslation();
  return (
    <Card className="relative overflow-hidden">
      <div className="opacity-60">
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <div className="flex items-center gap-2">
            <Bot className="size-5 text-brand-600 dark:text-brand-400" aria-hidden />
            <h2 className="text-lg font-semibold text-foreground">
              {t('comingSoon.dashboardTeaser.title')}
            </h2>
          </div>
          <StatusBadge variant="coming-soon" label={t('comingSoon.badge')} />
        </CardHeader>
        <CardContent>
          <BlurredScreenshot icon={Sparkles} compact />
          <p className="mt-3 text-sm text-muted-foreground">
            {t('comingSoon.dashboardTeaser.body')}
          </p>
        </CardContent>
      </div>
      {/* CTA escapes the dimmed wrapper so it stays interactive. */}
      <div className="pointer-events-none absolute inset-x-5 bottom-5 flex justify-end">
        <Button
          asChild
          variant="default"
          size="sm"
          className="pointer-events-auto shadow-md"
        >
          <Link to="/locked/ai-insights">
            {t('comingSoon.dashboardTeaser.cta')}
          </Link>
        </Button>
      </div>
    </Card>
  );
}
