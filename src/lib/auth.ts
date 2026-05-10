// STYLE_DISCIPLINE.md §0.12 — module-level state store. Auth placeholder for v1 scaffold.
// Real auth wires up later — this gives the router and AppShell something to hang on.
import { useSyncExternalStore, useEffect, useState } from 'react';
import type { Role, User } from '@/types/domain';

export interface ActiveSession {
  state: 'authenticated';
  id: string;
  profile: {
    id: string;
    email: string;
    displayName: string;
    role: Role;
  };
}

const STORAGE_KEY = 'unipay-session';
const SIGNOUT_REASON_KEY = 'unipay-signout-reason';
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 min

let cached: ActiveSession | null = readFromStorage();
const listeners = new Set<() => void>();

let lastActivityAt = Date.now();

function readFromStorage(): ActiveSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ActiveSession;
  } catch {
    return null;
  }
}

function persist(s: ActiveSession | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (s) window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    else window.sessionStorage.removeItem(STORAGE_KEY);
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

export function getSession(): ActiveSession | null {
  return cached;
}

export function useSession(): ActiveSession | null {
  return useSyncExternalStore(
    subscribe,
    () => cached,
    () => cached
  );
}

const DEV_USERS: Record<Role, ActiveSession['profile']> = {
  owner: {
    id: 'u-owner',
    email: 'owner@unipay.dev',
    displayName: 'Алишер Каримов',
    role: 'owner',
  },
  finance_manager: {
    id: 'u-finance',
    email: 'finance@unipay.dev',
    displayName: 'Дилнура Юсупова',
    role: 'finance_manager',
  },
  operator: {
    id: 'u-operator',
    email: 'operator@unipay.dev',
    displayName: 'Шохрух Эргашев',
    role: 'operator',
  },
  viewer: {
    id: 'u-viewer',
    email: 'viewer@unipay.dev',
    displayName: 'Мадина Тошева',
    role: 'viewer',
  },
};

export async function signIn(
  email: string,
  password: string
): Promise<{ ok: boolean; failureCode?: string }> {
  if (!email || !email.includes('@')) {
    return { ok: false, failureCode: 'invalid_credentials' };
  }
  if (!password || password.length < 6) {
    return { ok: false, failureCode: 'invalid_credentials' };
  }
  try {
    const res = await fetch('/api/auth/sign-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return { ok: false, failureCode: 'invalid_credentials' };
    const body = (await res.json()) as { data: { user: User; token: string } };
    const u = body.data.user;
    const session: ActiveSession = {
      state: 'authenticated',
      id: u.id,
      profile: {
        id: u.id,
        email: u.email,
        displayName: u.fullName,
        role: u.role,
      },
    };
    cached = session;
    persist(session);
    lastActivityAt = Date.now();
    notify();
    return { ok: true };
  } catch {
    return { ok: false, failureCode: 'invalid_credentials' };
  }
}

export function signInAsRole(role: Role): void {
  const profile = DEV_USERS[role];
  const session: ActiveSession = { state: 'authenticated', id: profile.id, profile };
  cached = session;
  persist(session);
  lastActivityAt = Date.now();
  notify();
}

export function signOut(opts?: { reason?: 'user' | 'session_expired' }): void {
  cached = null;
  persist(null);
  if (typeof window !== 'undefined' && opts?.reason) {
    try {
      window.sessionStorage.setItem(SIGNOUT_REASON_KEY, opts.reason);
    } catch {
      // ignore
    }
  }
  notify();
}

export function readSignOutReason(): 'user' | 'session_expired' | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = window.sessionStorage.getItem(SIGNOUT_REASON_KEY);
    return v === 'user' || v === 'session_expired' ? v : null;
  } catch {
    return null;
  }
}

export function clearSignOutReason(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(SIGNOUT_REASON_KEY);
  } catch {
    // ignore
  }
}

export function markActivity(): void {
  lastActivityAt = Date.now();
}

if (typeof window !== 'undefined') {
  // Track activity for idle detection.
  for (const evt of ['mousedown', 'keydown', 'scroll', 'touchstart'] as const) {
    window.addEventListener(evt, markActivity, { passive: true });
  }
}

export function useIdleTimeout(): 'active' | 'idle' {
  const [state, setState] = useState<'active' | 'idle'>('active');
  useEffect(() => {
    const id = window.setInterval(() => {
      const idle = Date.now() - lastActivityAt > IDLE_TIMEOUT_MS;
      setState(idle ? 'idle' : 'active');
    }, 30_000);
    return () => window.clearInterval(id);
  }, []);
  return state;
}
