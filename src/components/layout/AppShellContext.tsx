import { createContext, useContext } from 'react';

export interface AppShellActions {
  openCommandPalette: () => void;
  openHelp: () => void;
  onboardingActive: boolean;
  setOnboardingActive: (b: boolean) => void;
}

const NOOP: AppShellActions = {
  openCommandPalette: () => undefined,
  openHelp: () => undefined,
  onboardingActive: false,
  setOnboardingActive: () => undefined,
};

export const AppShellContext = createContext<AppShellActions>(NOOP);

export function useAppShell(): AppShellActions {
  return useContext(AppShellContext);
}
