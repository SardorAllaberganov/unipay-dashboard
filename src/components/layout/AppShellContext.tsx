import { createContext, useContext } from 'react';

export interface AppShellActions {
  openCommandPalette: () => void;
  openHelp: () => void;
}

const NOOP: AppShellActions = {
  openCommandPalette: () => undefined,
  openHelp: () => undefined,
};

export const AppShellContext = createContext<AppShellActions>(NOOP);

export function useAppShell(): AppShellActions {
  return useContext(AppShellContext);
}
