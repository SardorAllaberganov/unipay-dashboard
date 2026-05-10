import { useSyncExternalStore } from 'react';

let cached: boolean = typeof navigator === 'undefined' ? true : navigator.onLine;
const listeners = new Set<() => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    cached = true;
    for (const l of listeners) l();
  });
  window.addEventListener('offline', () => {
    cached = false;
    for (const l of listeners) l();
  });
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** React hook — subscribes to network state. */
export function useNetworkState(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => cached,
    () => cached
  );
}

/** Non-React snapshot — used by ancestors of WriteButton without re-rendering them. */
export function getNetworkState(): boolean {
  return cached;
}
