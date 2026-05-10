import { Compass } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SystemStateLayout } from './SystemStateLayout';

interface Props {
  fullBleed?: boolean;
}

export function NotFoundState({ fullBleed }: Props) {
  const { t } = useTranslation();
  return (
    <SystemStateLayout
      variant={fullBleed ? 'full-bleed' : 'in-shell'}
      icon={Compass}
      iconTone="slate"
      title={t('system.notFound.title')}
      body={t('system.notFound.body')}
      primary={{ label: t('system.notFound.primary'), to: '/' }}
    />
  );
}
