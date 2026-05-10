// Canonical keyboard shortcut registry. Used by HelpOverlay (Dialog) and CommandPalette (cmdk).
export interface Shortcut {
  id: string;
  group: 'global' | 'navigate' | 'theme';
  keys: string[]; // each entry is a kbd-rendered token, e.g. '⌘', 'K' or 'g', 'd'
  labelKey: string;
  description: string;
  to?: string;
}

export const SHORTCUTS: Shortcut[] = [
  // Global
  { id: 'palette', group: 'global', keys: ['⌘', 'K'], labelKey: 'common.actions.openSearch', description: 'Open command palette' },
  { id: 'help', group: 'global', keys: ['?'], labelKey: 'common.actions.showHelp', description: 'Keyboard shortcuts' },
  { id: 'search', group: 'global', keys: ['/'], labelKey: 'common.actions.search', description: 'Focus search' },
  { id: 'theme', group: 'theme', keys: ['t'], labelKey: 'common.actions.toggleTheme', description: 'Toggle theme' },

  // Navigate (g chord)
  { id: 'go-dashboard', group: 'navigate', keys: ['g', 'd'], labelKey: 'nav.dashboard', description: 'Go to dashboard', to: '/' },
  { id: 'go-students', group: 'navigate', keys: ['g', 's'], labelKey: 'nav.students', description: 'Go to students', to: '/students' },
  { id: 'go-payments', group: 'navigate', keys: ['g', 'p'], labelKey: 'nav.transactions', description: 'Go to transactions', to: '/payments/transactions' },
  { id: 'go-payouts', group: 'navigate', keys: ['g', 'y'], labelKey: 'nav.payouts', description: 'Go to payouts', to: '/payouts' },
  { id: 'go-reports', group: 'navigate', keys: ['g', 'r'], labelKey: 'nav.reports', description: 'Go to reports', to: '/reports' },
  { id: 'go-settings', group: 'navigate', keys: ['g', ','], labelKey: 'nav.settings', description: 'Go to settings', to: '/settings' },
];

export const SHORTCUT_GROUPS: { id: Shortcut['group']; titleKey: string }[] = [
  { id: 'global', titleKey: 'nav.section.system' },
  { id: 'navigate', titleKey: 'nav.section.main' },
  { id: 'theme', titleKey: 'common.actions.toggleTheme' },
];
