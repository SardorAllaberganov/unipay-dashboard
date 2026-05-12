import { ApiKeysCard } from '../components/ApiKeysCard';
import { WebhookConfigCard } from '../components/WebhookConfigCard';
import { WebhookDeliveriesCard } from '../components/WebhookDeliveriesCard';

export default function ApiTab() {
  return (
    <div className="space-y-6">
      <ApiKeysCard />
      <WebhookConfigCard />
      <WebhookDeliveriesCard />
    </div>
  );
}
