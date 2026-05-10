import { Wrench } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import {
  refreshMaintenanceState,
  useMaintenanceState,
} from '@/lib/maintenanceState';
import { SystemStateLayout } from './SystemStateLayout';

interface Props {
  startedAtOverride?: number | null;
  estimatedEndAtOverride?: number | null;
}

export function MaintenanceState({ startedAtOverride, estimatedEndAtOverride }: Props) {
  const { t } = useTranslation();
  const live = useMaintenanceState();

  // Tick once a minute so relative time stays fresh.
  useEffect(() => {
    const id = window.setInterval(refreshMaintenanceState, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const estimatedEndAt =
    estimatedEndAtOverride !== undefined ? estimatedEndAtOverride : live.estimatedEndAt;

  // Reference startedAtOverride for completeness even though we only render the end time.
  void startedAtOverride;

  const estimatedNote = estimatedEndAt
    ? t('system.maintenance.estimated', { time: format(estimatedEndAt, 'HH:mm') })
    : null;

  return (
    <SystemStateLayout
      variant="full-bleed"
      icon={Wrench}
      iconTone="warning"
      title={t('system.maintenance.title')}
      body={t('system.maintenance.body')}
      primary={{ label: t('system.maintenance.primary'), onClick: () => window.location.reload() }}
      footer={estimatedNote ? <span>{estimatedNote}</span> : null}
    />
  );
}
