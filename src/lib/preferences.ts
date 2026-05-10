// STYLE_DISCIPLINE.md §0.12 — module-level state store, useSyncExternalStore pattern.
// Persists per-user dashboard preferences. Boots DOM hooks on <html> so globals.css cascades.
import { useSyncExternalStore } from 'react';
import type { Locale } from '@/types/domain';

export interface AdminPreferences {
  theme: 'light' | 'dark' | 'system';
  density: 'compact' | 'comfortable';
  language: Locale;
  timezone: string;
  date_format: 'eu' | 'iso';
  time_format: '12h' | '24h';
  tabular_numerals: boolean;
}

const STORAGE_KEY = 'unipay-preferences';

const DEFAULT: AdminPreferences = {
  theme: 'system',
  density: 'compact',
  language: 'ru',
  timezone: 'Asia/Tashkent',
  date_format: 'eu',
  time_format: '24h',
  tabular_numerals: true,
};

let cached: AdminPreferences = readFromStorage();
const listeners = new Set<() => void>();

function readFromStorage(): AdminPreferences {
  if (typeof window === 'undefined') return DEFAULT;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw) as Partial<AdminPreferences>;
    return { ...DEFAULT, ...parsed };
  } catch {
    return DEFAULT;
  }
}

function applyDom(p: AdminPreferences): void {
  if (typeof document === 'undefined') return;
  const html = document.documentElement;
  html.setAttribute('data-density', p.density);
  html.setAttribute('data-tabular-nums', String(p.tabular_numerals));
}

function notify(): void {
  for (const l of listeners) l();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Cross-tab sync via storage events.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY) return;
    cached = readFromStorage();
    applyDom(cached);
    notify();
  });
}

/**
 * Boot — call once at module load (App.tsx).
 * Applies data-density + data-tabular-nums to <html> so first paint reflects stored prefs.
 */
export function bootPreferences(): void {
  cached = readFromStorage();
  applyDom(cached);
}

export function getPreferences(): AdminPreferences {
  return cached;
}

export function updatePreferences(patch: Partial<AdminPreferences>): AdminPreferences {
  cached = { ...cached, ...patch };
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
    } catch {
      // Quota / private mode — ignore.
    }
  }
  applyDom(cached);
  notify();
  return cached;
}

export function usePreferences(): AdminPreferences {
  return useSyncExternalStore(subscribe, getPreferences, getPreferences);
}
