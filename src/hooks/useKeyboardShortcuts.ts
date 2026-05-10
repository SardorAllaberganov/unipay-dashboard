import { useEffect } from 'react';

interface ShortcutHandlers {
  onCommandPalette?: () => void;
  onHelp?: () => void;
  onToggleTheme?: () => void;
  onSearch?: () => void;
  onEscape?: () => void;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return false;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers): void {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // ⌘K / Ctrl+K — command palette (works even when typing).
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handlers.onCommandPalette?.();
        return;
      }

      // Esc — always.
      if (e.key === 'Escape') {
        handlers.onEscape?.();
        return;
      }

      // Other shortcuts only when not typing.
      if (isTypingTarget(e.target)) return;

      if (e.key === '?') {
        e.preventDefault();
        handlers.onHelp?.();
        return;
      }
      if (e.key === '/') {
        e.preventDefault();
        handlers.onSearch?.();
        return;
      }
      if (e.key === 't' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        handlers.onToggleTheme?.();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handlers]);
}
