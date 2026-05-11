// Timeline helpers. Lives outside TransactionTimeline.tsx so
// react-refresh/only-export-components stays clean.
import type { PaymentStatus, TransactionEvent, TransactionEventType } from '@/types/domain';

const ALL_EVENT_TYPES: TransactionEventType[] = [
  'created',
  'processed',
  'settled',
  'failed',
  'refunded',
];

export function deriveUpcomingTypes(
  status: PaymentStatus,
  events: TransactionEvent[],
): TransactionEventType[] {
  const passed = new Set(events.map((e) => e.type));
  if (status === 'pending' || status === 'processing') {
    return ALL_EVENT_TYPES.filter(
      (tp) => tp === 'processed' || tp === 'settled',
    ).filter((tp) => !passed.has(tp));
  }
  return [];
}
