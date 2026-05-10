import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSession } from '@/lib/auth';
import { getGreetingKey } from '@/lib/greeting';

function firstNameFrom(displayName: string | undefined): string {
  if (!displayName) return '';
  const trimmed = displayName.trim();
  if (!trimmed) return '';
  return trimmed.split(/\s+/)[0] ?? '';
}

function msUntilNextHour(): number {
  const now = new Date();
  const next = new Date(now);
  next.setMinutes(0, 0, 0);
  next.setHours(now.getHours() + 1);
  return Math.max(60_000, next.getTime() - now.getTime());
}

export function GreetingTitle() {
  const { t } = useTranslation();
  const session = useSession();
  const [greetingKey, setGreetingKey] = useState(() => getGreetingKey());

  // Re-evaluate at each hour boundary so the greeting flips morning, day, evening live without reload.
  useEffect(() => {
    let timeoutId: number;
    const schedule = () => {
      timeoutId = window.setTimeout(() => {
        setGreetingKey(getGreetingKey());
        schedule();
      }, msUntilNextHour());
    };
    schedule();
    return () => window.clearTimeout(timeoutId);
  }, []);

  const firstName = firstNameFrom(session?.profile.displayName);
  return <span>{t(`dashboard.greeting.${greetingKey}`, { name: firstName })}</span>;
}
