import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import type { OnboardingDraft } from '../schemas';

interface OnboardingContextValue {
  draft: OnboardingDraft;
  setStepData: <K extends keyof OnboardingDraft>(key: K, data: OnboardingDraft[K]) => void;
  markStepComplete: (step: number) => void;
  resetDraft: () => void;
  hydrate: (next: OnboardingDraft) => void;
}

const Context = createContext<OnboardingContextValue | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('useOnboarding must be used inside OnboardingProvider');
  return ctx;
}

interface ProviderProps {
  children: ReactNode;
  initialDraft?: OnboardingDraft;
}

const EMPTY_DRAFT: OnboardingDraft = { completedSteps: [] };

export function OnboardingProvider({ children, initialDraft }: ProviderProps) {
  const [draft, setDraft] = useState<OnboardingDraft>(initialDraft ?? EMPTY_DRAFT);

  const setStepData = useCallback(
    <K extends keyof OnboardingDraft>(key: K, data: OnboardingDraft[K]) => {
      setDraft((d) => ({ ...d, [key]: data }));
    },
    []
  );

  const markStepComplete = useCallback((step: number) => {
    setDraft((d) => {
      if (d.completedSteps.includes(step)) return d;
      return { ...d, completedSteps: [...d.completedSteps, step].sort((a, b) => a - b) };
    });
  }, []);

  const resetDraft = useCallback(() => setDraft(EMPTY_DRAFT), []);
  const hydrate = useCallback((next: OnboardingDraft) => setDraft(next), []);

  return (
    <Context.Provider value={{ draft, setStepData, markStepComplete, resetDraft, hydrate }}>
      {children}
    </Context.Provider>
  );
}
