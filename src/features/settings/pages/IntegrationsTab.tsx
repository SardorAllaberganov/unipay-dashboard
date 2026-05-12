// Settings → Integrations tab. Disabled cards for HEMIS / 1C / custom ERP.
// Each card routes to the matching /locked/integrations-:slug landing.
//
// Phase 2 surface — kept minimal in Prompt 11. When real integrations ship, this
// becomes a connected-services management surface.
import { useTranslation } from 'react-i18next';
import { GraduationCap, Link2, Server } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IntegrationCard } from '../components/IntegrationCard';

export default function IntegrationsTab() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.integrations.title')}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t('settings.integrations.subtitle')}
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <IntegrationCard
              slug="hemis"
              icon={GraduationCap}
              name="HEMIS"
              descriptionKey="settings.integrations.hemis.description"
            />
            <IntegrationCard
              slug="1c"
              icon={Server}
              name="1C"
              descriptionKey="settings.integrations.oneC.description"
            />
            <IntegrationCard
              slug="custom"
              icon={Link2}
              name={t('settings.integrations.custom.name')}
              descriptionKey="settings.integrations.custom.description"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
