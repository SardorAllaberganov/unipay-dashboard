// STYLE_DISCIPLINE.md §0.12 — module-level state store. Tracks the current user's
// own active sessions (one per signed-in device). Distinct from the staff feature's
// `useStaffSessions` query, which is scoped by `staffId` and is used by Owner-level
// reviewers managing other people. This store is scoped to the active session and
// is consumed by /settings/security.
//
// useSyncExternalStore pattern with:
//   - module-level cache (array reference is stable between mutations — only swapped
//     on actual change, so React doesn't re-render unnecessarily)
//   - listener Set notified on mutation
//   - storage-event listener on a sentinel key for cross-tab sync (revoke in tab A
//     bumps the key; tab B's handler re-fetches and replaces the cache)
//
// The store doesn't own the network round-trip — `useMyActiveSessions()` wraps
// TanStack Query around the cache so loading/error/offline states stay in the
// hook layer. The store's job is in-memory caching + cross-tab notification.
import { useSyncExternalStore } from 'react';
import type { MySession } from '@/types/domain';

const SYNC_KEY = 'unipay-my-sessions-sync';

let cached: MySession[] | null = null;
const listeners = new Set<() => void>();

function notify(): void {
  for (const l of listeners) l();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * getSnapshot — returns the cached array reference. **Must stay stable between
 * mutations** (only swap on real change) so `useSyncExternalStore` doesn't
 * trigger an infinite re-render loop. LESSON: never `return cached ?? []` inline
 * — that creates a fresh array every call.
 */
function getSnapshot(): MySession[] | null {
  return cached;
}

/** Frozen empty list during SSR / first render — avoids hydration drift. */
const SERVER_SNAPSHOT: readonly MySession[] = Object.freeze([]);
function getServerSnapshot(): MySession[] | null {
  return SERVER_SNAPSHOT as unknown as MySession[];
}

/** Replace the entire sessions list. Called by `useMyActiveSessions` after a fetch. */
export function setMySessions(next: MySession[]): void {
  cached = next;
  notify();
}

/** Optimistically remove a session from cache. The fetch round-trip is the source of truth. */
export function removeMySessionFromCache(id: string): void {
  if (!cached) return;
  cached = cached.filter((s) => s.id !== id);
  notify();
}

/** Optimistically remove every non-current session. */
export function removeOtherMySessionsFromCache(): void {
  if (!cached) return;
  cached = cached.filter((s) => s.current);
  notify();
}

/** Broadcast a revoke event to other tabs. They invalidate their cache via the storage listener. */
export function broadcastSessionsChange(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SYNC_KEY, String(Date.now()));
  } catch {
    // Quota / private mode — silently skip.
  }
}

/**
 * Subscribe to cross-tab sync events. Returns an unsubscribe fn.
 * The consumer is expected to refetch on event (TanStack Query invalidation is the
 * canonical wiring inside `useMyActiveSessions`).
 */
export function subscribeToCrossTabSessions(handler: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const listener = (e: StorageEvent) => {
    if (e.key !== SYNC_KEY) return;
    handler();
  };
  window.addEventListener('storage', listener);
  return () => window.removeEventListener('storage', listener);
}

/** React hook — subscribes to the in-memory sessions cache. */
export function useMySessionsSnapshot(): MySession[] | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
