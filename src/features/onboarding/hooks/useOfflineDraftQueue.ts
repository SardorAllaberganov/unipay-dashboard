import { useCallback, useEffect } from 'react';
import { useNetworkState } from '@/hooks/useNetworkState';
import { patchDraft } from '../api';
import type { OnboardingDraft } from '../schemas';

const QUEUE_KEY = 'unipay-onboarding-draft-queue';

function readQueue(): Partial<OnboardingDraft> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as Partial<OnboardingDraft>) : null;
  } catch {
    return null;
  }
}

function writeQueue(draft: Partial<OnboardingDraft> | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (draft) window.localStorage.setItem(QUEUE_KEY, JSON.stringify(draft));
    else window.localStorage.removeItem(QUEUE_KEY);
  } catch {
    // ignore
  }
}

interface UseOfflineDraftQueue {
  queueDraft: (draft: Partial<OnboardingDraft>) => void;
}

export function useOfflineDraftQueue(): UseOfflineDraftQueue {
  const online = useNetworkState();

  useEffect(() => {
    if (!online) return;
    const queued = readQueue();
    if (!queued) return;
    patchDraft(queued)
      .then(() => writeQueue(null))
      .catch(() => undefined);
  }, [online]);

  const queueDraft = useCallback((draft: Partial<OnboardingDraft>) => writeQueue(draft), []);
  return { queueDraft };
}
