// Preferences tab — local-only UI prefs (density + tabular numerals).
// Wires directly to src/lib/preferences.ts module store; the store applies
// data-density / data-tabular-nums attrs to <html> and broadcasts via storage
// events so other tabs in the same browser update immediately.
//
// No <WriteButton> here — these are local, non-server writes.
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { updatePreferences, usePreferences } from '@/lib/preferences';
import { PreferencesLivePreview } from '../components/PreferencesLivePreview';

export default function PreferencesTab() {
  const { t } = useTranslation();
  const prefs = usePreferences();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.preferences.density.title')}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t('settings.preferences.density.description')}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={prefs.density}
            onValueChange={(v) =>
              updatePreferences({ density: v as 'compact' | 'comfortable' })
            }
            className="grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            <Label
              htmlFor="density-comfortable"
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/40 has-[input:checked]:border-brand-600 has-[input:checked]:bg-brand-50/40"
            >
              <RadioGroupItem id="density-comfortable" value="comfortable" className="mt-1" />
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground">
                  {t('settings.preferences.density.comfortable.label')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('settings.preferences.density.comfortable.help')}
                </p>
              </div>
            </Label>
            <Label
              htmlFor="density-compact"
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/40 has-[input:checked]:border-brand-600 has-[input:checked]:bg-brand-50/40"
            >
              <RadioGroupItem id="density-compact" value="compact" className="mt-1" />
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground">
                  {t('settings.preferences.density.compact.label')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('settings.preferences.density.compact.help')}
                </p>
              </div>
            </Label>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.preferences.tabular.title')}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t('settings.preferences.tabular.description')}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                {t('settings.preferences.tabular.toggleLabel')}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('settings.preferences.tabular.toggleHelp')}
              </p>
            </div>
            <Switch
              checked={prefs.tabular_numerals}
              onCheckedChange={(checked) =>
                updatePreferences({ tabular_numerals: checked })
              }
              aria-label={t('settings.preferences.tabular.toggleLabel')}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.preferences.preview.title')}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t('settings.preferences.preview.description')}
          </p>
        </CardHeader>
        <CardContent>
          <PreferencesLivePreview />
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        {t('settings.preferences.localNote')}
      </p>
    </div>
  );
}
