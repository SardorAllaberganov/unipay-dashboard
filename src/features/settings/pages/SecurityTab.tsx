import { ChangePasswordCard } from '../components/ChangePasswordCard';
import { TwoFaCard } from '../components/TwoFaCard';
import { ActiveSessionsCard } from '../components/ActiveSessionsCard';
import { LoginHistoryCard } from '../components/LoginHistoryCard';

export default function SecurityTab() {
  return (
    <div className="space-y-6">
      <ChangePasswordCard />
      <TwoFaCard />
      <ActiveSessionsCard />
      <LoginHistoryCard />
    </div>
  );
}
