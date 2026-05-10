import { Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SystemStateLayout } from './SystemStateLayout';

interface Props {
  preview?: boolean;
  fullBleed?: boolean;
}

export function ForbiddenState({ fullBleed }: Props) {
  const { t } = useTranslation();
  return (
    <SystemStateLayout
      variant={fullBleed ? 'full-bleed' : 'in-shell'}
      icon={Lock}
      iconTone="warning"
      title={t('system.forbidden.title')}
      body={t('system.forbidden.body')}
      primary={{ label: t('system.forbidden.primary'), to: '/' }}
    />
  );
}
