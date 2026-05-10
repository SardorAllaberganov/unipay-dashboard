// System event log — replace with real telemetry sink later (Sentry / Datadog / etc).
import { generateReferenceId } from './referenceId';

interface PageErrorInput {
  route: string;
  error: Error;
}

export function logPageError(input: PageErrorInput): string {
  const referenceId = generateReferenceId();
  if (typeof console !== 'undefined') {
    console.error('[unipay] page error', { referenceId, ...input });
  }
  return referenceId;
}
