import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'unipay-auth-failed-attempts';
const WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_THRESHOLD = 5;

interface FailedAttemptsState {
  count: number;
  firstFailureAt: number | null;
}

const INITIAL: FailedAttemptsState = { count: 0, firstFailureAt: null };

function read(): FailedAttemptsState {
  if (typeof window === 'undefined') return INITIAL;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL;
    const parsed = JSON.parse(raw) as Partial<FailedAttemptsState>;
    return {
      count: typeof parsed.count === 'number' ? parsed.count : 0,
      firstFailureAt:
        typeof parsed.firstFailureAt === 'number' ? parsed.firstFailureAt : null,
    };
  } catch {
    return INITIAL;
  }
}

function persist(s: FailedAttemptsState): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // ignore
  }
}

let state: FailedAttemptsState = read();
const listeners = new Set<() => void>();

function notify(): void {
  for (const l of listeners) l();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): FailedAttemptsState {
  return state;
}

function getServerSnapshot(): FailedAttemptsState {
  return INITIAL;
}

export function useFailedAttempts(): FailedAttemptsState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function recordFailure(): void {
  const now = Date.now();
  const expired = state.firstFailureAt !== null && now - state.firstFailureAt >= WINDOW_MS;
  state = expired || state.firstFailureAt === null
    ? { count: 1, firstFailureAt: now }
    : { count: state.count + 1, firstFailureAt: state.firstFailureAt };
  persist(state);
  notify();
}

export function recordSuccess(): void {
  state = INITIAL;
  persist(state);
  notify();
}

export function isLockedOut(s: FailedAttemptsState, now: number = Date.now()): boolean {
  if (s.count < LOCKOUT_THRESHOLD) return false;
  if (s.firstFailureAt === null) return false;
  return now - s.firstFailureAt < WINDOW_MS;
}

export function getLockoutRemainingMs(
  s: FailedAttemptsState,
  now: number = Date.now()
): number {
  if (s.firstFailureAt === null) return 0;
  const elapsed = now - s.firstFailureAt;
  return Math.max(0, WINDOW_MS - elapsed);
}
