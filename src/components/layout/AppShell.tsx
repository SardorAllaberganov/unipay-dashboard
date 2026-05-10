import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useTheme } from '@/providers/ThemeProvider';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { OfflineBanner } from '@/components/system/OfflineBanner';
import { cn } from '@/lib/utils';
import { AppShellContext, type AppShellActions } from './AppShellContext';
import { Sidebar } from './Sidebar';
import { TopBar } from './Topbar';
import { CommandPalette } from './CommandPalette';
import { HelpOverlay } from './HelpOverlay';

interface Props {
  children: ReactNode;
}

export function AppShell({ children }: Props) {
  const { resolvedTheme, setTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Auto-collapse on tablet
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 1023px)');
    const apply = () => setCollapsed(mql.matches);
    apply();
    mql.addEventListener('change', apply);
    return () => mql.removeEventListener('change', apply);
  }, []);

  useKeyboardShortcuts({
    onCommandPalette: () => setPaletteOpen((v) => !v),
    onHelp: () => setHelpOpen(true),
    onToggleTheme: () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'),
    onSearch: () => searchRef.current?.focus(),
    onEscape: () => {
      if (paletteOpen) setPaletteOpen(false);
      if (helpOpen) setHelpOpen(false);
      if (mobileOpen) setMobileOpen(false);
    },
  });

  const sidebarWidthPx = collapsed ? 64 : 240;

  const openCommandPalette = useCallback(() => setPaletteOpen(true), []);
  const openHelp = useCallback(() => setHelpOpen(true), []);
  const shellActions = useMemo<AppShellActions>(
    () => ({ openCommandPalette, openHelp }),
    [openCommandPalette, openHelp]
  );

  return (
    <TooltipProvider delayDuration={200}>
      <AppShellContext.Provider value={shellActions}>
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>

        <div
          className="flex h-dvh bg-background"
          style={{ ['--sidebar-width' as string]: `${sidebarWidthPx}px` }}
        >
          <div className="hidden md:flex">
            <Sidebar
              collapsed={collapsed}
              onToggle={() => setCollapsed((v) => !v)}
            />
          </div>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetContent side="left" className="w-[280px] p-0">
              <Sidebar
                collapsed={false}
                onToggle={() => setMobileOpen(false)}
                onItemClick={() => setMobileOpen(false)}
              />
            </SheetContent>
          </Sheet>

          <div className="flex min-w-0 flex-1 flex-col">
            <TopBar
              onCommandPalette={() => setPaletteOpen(true)}
              onMobileMenu={() => setMobileOpen(true)}
              onShowHelp={() => setHelpOpen(true)}
              searchInputRef={searchRef}
            />

            <OfflineBanner />

            <main
              id="main-content"
              tabIndex={-1}
              className={cn('flex-1 overflow-y-auto p-4 outline-none md:p-6')}
            >
              {children}
            </main>
          </div>
        </div>

        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
        <HelpOverlay open={helpOpen} onOpenChange={setHelpOpen} />
      </AppShellContext.Provider>
    </TooltipProvider>
  );
}
