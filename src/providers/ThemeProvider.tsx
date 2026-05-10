// Standard shadcn-style ThemeProvider — light/dark/system.
// v1 ships light-only by default; dark is selectable via VITE_FEATURE_DARK_MODE.
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function readStored(storageKey: string): Theme | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = window.localStorage.getItem(storageKey);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
    return null;
  } catch {
    return null;
  }
}

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  storageKey = 'unipay-theme',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => readStored(storageKey) ?? defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    theme === 'system' ? getSystemTheme() : theme
  );

  useEffect(() => {
    const root = document.documentElement;
    const target: ResolvedTheme = theme === 'system' ? getSystemTheme() : theme;
    setResolvedTheme(target);
    root.classList.toggle('dark', target === 'dark');
  }, [theme]);

  useEffect(() => {
    if (theme !== 'system') return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const target = getSystemTheme();
      setResolvedTheme(target);
      document.documentElement.classList.toggle('dark', target === 'dark');
    };
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [theme]);

  const setTheme = (t: Theme) => {
    try {
      window.localStorage.setItem(storageKey, t);
    } catch {
      // ignore
    }
    setThemeState(t);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
