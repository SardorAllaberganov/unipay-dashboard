// STYLE_DISCIPLINE.md §0.12 — module-level state store. Maintenance gate.
import { useSyncExternalStore } from 'react';

export interface MaintenanceState {
  active: boolean;
  startedAt: number | null;
  estimatedEndAt: number | null;
}

const STORAGE_KEY = 'unipay-maintenance';
const DEFAULT_WINDOW_MS = 30 * 60 * 1000; // 30 min QA window

const DEFAULT: MaintenanceState = { active: false, startedAt: null, estimatedEndAt: null };

let cached: MaintenanceState = readFromStorage();
const listeners = new Set<() => void>();

function readFromStorage(): MaintenanceState {
  if (typeof window === 'undefined') return DEFAULT;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw) as Partial<MaintenanceState>;
    return { ...DEFAULT, ...parsed };
  } catch {
    return DEFAULT;
  }
}

function persist(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
  } catch {
    // ignore
  }
}

function notify(): void {
  for (const l of listeners) l();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Cross-tab sync.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY) return;
    cached = readFromStorage();
    notify();
  });
}

/**
 * Reads ?maintenance=on|off, applies, then strips the query param.
 * `on` with no estimated end uses a default 30-min window for QA.
 */
export function bootMaintenanceFromUrl(): void {
  cached = readFromStorage();
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  const flag = url.searchParams.get('maintenance');
  if (flag === 'on') {
    enterMaintenance();
    url.searchParams.delete('maintenance');
    window.history.replaceState({}, '', url.toString());
  } else if (flag === 'off') {
    exitMaintenance();
    url.searchParams.delete('maintenance');
    window.history.replaceState({}, '', url.toString());
  }
}

export function enterMaintenance(input?: { estimatedEndAt?: number | null }): void {
  const now = Date.now();
  cached = {
    active: true,
    startedAt: now,
    estimatedEndAt:
      input?.estimatedEndAt === undefined ? now + DEFAULT_WINDOW_MS : input.estimatedEndAt,
  };
  persist();
  notify();
}

export function exitMaintenance(): void {
  cached = { ...DEFAULT };
  persist();
  notify();
}

export function useMaintenanceState(): MaintenanceState {
  return useSyncExternalStore(
    subscribe,
    () => cached,
    () => cached
  );
}

/** Notify listeners without changing state — useful for relative-time tickers. */
export function refreshMaintenanceState(): void {
  notify();
}
