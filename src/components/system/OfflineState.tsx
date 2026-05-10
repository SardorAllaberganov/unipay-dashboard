import { WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNetworkState } from '@/hooks/useNetworkState';
import { SystemStateLayout } from './SystemStateLayout';

interface Props {
  forceVisible?: boolean;
  fullBleed?: boolean;
}

export function OfflineState({ forceVisible, fullBleed }: Props) {
  const { t } = useTranslation();
  const online = useNetworkState();

  // Only render when offline (or in preview).
  if (online && !forceVisible) return null;

  return (
    <SystemStateLayout
      variant={fullBleed ? 'full-bleed' : 'in-shell'}
      icon={WifiOff}
      iconTone="slate"
      title={t('system.offline.title')}
      body={t('system.offline.body')}
      primary={{ label: t('system.offline.retry'), onClick: () => window.location.reload() }}
    />
  );
}
