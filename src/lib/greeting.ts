import { TASHKENT_TZ } from './format';

export type GreetingKey = 'morning' | 'day' | 'evening';

const hourFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: TASHKENT_TZ,
  hour: 'numeric',
  hourCycle: 'h23',
});

export function getGreetingKey(now: Date = new Date()): GreetingKey {
  const hour = Number(hourFormatter.format(now));
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'day';
  return 'evening';
}
