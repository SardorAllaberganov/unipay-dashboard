// STYLE_DISCIPLINE.md §0.7 — sidebar pattern, mobile collapses into Sheet.
// `text-xs` here is allowed only on uppercase tracking-wider section labels per §0.2.
import {
  ArrowLeftRight,
  Banknote,
  Bot,
  Building2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileBarChart,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Lock,
  MessageSquare,
  Settings,
  Smartphone,
  Undo2,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useAppShell } from './AppShellContext';
import { UnipayLogo } from './UnipayLogo';

interface NavItem {
  to: string;
  labelKey: string;
  icon: LucideIcon;
  /** Coming-soon items route to /locked/:feature; visually muted + lock overlay. */
  status?: 'coming-soon';
}
interface NavSection {
  titleKey: string;
  items: NavItem[];
}

const SECTIONS: NavSection[] = [
  {
    titleKey: 'nav.section.main',
    items: [{ to: '/', labelKey: 'nav.dashboard', icon: LayoutDashboard }],
  },
  {
    titleKey: 'nav.section.organization',
    items: [
      { to: '/organization', labelKey: 'nav.organization', icon: Building2 },
      { to: '/staff', labelKey: 'nav.staff', icon: Users },
    ],
  },
  {
    titleKey: 'nav.section.students',
    items: [
      { to: '/students', labelKey: 'nav.students', icon: GraduationCap },
      {
        to: '/locked/documents',
        labelKey: 'nav.documents',
        icon: FileText,
        status: 'coming-soon',
      },
    ],
  },
  {
    titleKey: 'nav.section.payments',
    items: [
      { to: '/payments/transactions', labelKey: 'nav.transactions', icon: ArrowLeftRight },
      { to: '/payments/pending', labelKey: 'nav.pending', icon: Clock },
      { to: '/payments/refunds', labelKey: 'nav.refunds', icon: Undo2 },
      {
        to: '/locked/sms-campaigns',
        labelKey: 'nav.smsCampaigns',
        icon: MessageSquare,
        status: 'coming-soon',
      },
    ],
  },
  {
    titleKey: 'nav.section.finance',
    items: [
      { to: '/reports', labelKey: 'nav.reports', icon: FileBarChart },
      { to: '/payouts', labelKey: 'nav.payouts', icon: Banknote },
      {
        to: '/locked/ai-insights',
        labelKey: 'nav.aiInsights',
        icon: Bot,
        status: 'coming-soon',
      },
    ],
  },
  {
    titleKey: 'nav.section.system',
    items: [
      { to: '/settings', labelKey: 'nav.settings', icon: Settings },
      {
        to: '/locked/mobile-app',
        labelKey: 'nav.mobileApp',
        icon: Smartphone,
        status: 'coming-soon',
      },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onItemClick?: () => void;
  className?: string;
}

export function Sidebar({ collapsed, onToggle, onItemClick, className }: SidebarProps) {
  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-border bg-card transition-[width] duration-base ease-standard',
        collapsed ? 'w-[64px]' : 'w-[240px]',
        className
      )}
      aria-label="Primary navigation"
    >
      <div
        className={cn(
          'flex h-14 items-center border-b border-border px-4',
          collapsed && 'justify-center px-0'
        )}
      >
        <UnipayLogo collapsed={collapsed} />
      </div>

      <ScrollArea className="flex-1">
        <nav className="space-y-4 px-2 py-3">
          {SECTIONS.map((section) => (
            <NavSectionView
              key={section.titleKey}
              section={section}
              collapsed={collapsed}
              onItemClick={onItemClick}
            />
          ))}
        </nav>
      </ScrollArea>

      <div className="border-t border-border p-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn('h-8 w-full', !collapsed && 'justify-end')}
        >
          {collapsed ? (
            <ChevronRight className="size-4" aria-hidden />
          ) : (
            <ChevronLeft className="size-4" aria-hidden />
          )}
        </Button>
      </div>
    </aside>
  );
}

function NavSectionView({
  section,
  collapsed,
  onItemClick,
}: {
  section: NavSection;
  collapsed: boolean;
  onItemClick?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div>
      {!collapsed ? (
        <div className="mb-1.5 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {t(section.titleKey)}
        </div>
      ) : null}
      <ul className="space-y-0.5">
        {section.items.map((item) => (
          <NavItemView
            key={item.to}
            item={item}
            collapsed={collapsed}
            onClick={onItemClick}
          />
        ))}
      </ul>
    </div>
  );
}

function NavItemView({
  item,
  collapsed,
  onClick,
}: {
  item: NavItem;
  collapsed: boolean;
  onClick?: () => void;
}) {
  const { t } = useTranslation();
  const { onboardingActive } = useAppShell();
  const Icon = item.icon;
  const label = t(item.labelKey);
  const isComingSoon = item.status === 'coming-soon';

  if (onboardingActive) {
    return (
      <li>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              role="link"
              aria-disabled="true"
              tabIndex={0}
              className={cn(
                'group relative flex h-9 cursor-not-allowed items-center gap-2.5 rounded-md px-3 text-sm font-medium opacity-50',
                collapsed && 'justify-center px-0'
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {!collapsed ? <span className="truncate">{label}</span> : null}
            </span>
          </TooltipTrigger>
          <TooltipContent side="right">
            {t('onboarding.sidebarLockedTooltip')}
          </TooltipContent>
        </Tooltip>
      </li>
    );
  }

  // Coming-soon items: muted + lock badge, but still clickable so users
  // can land on /locked/:feature for full content. aria-label reinforces
  // the state for screen readers. Active state stays NEUTRAL (bg-muted +
  // text-foreground) — never brand-active — because these aren't "real"
  // routes the user "is on" in the normal navigational sense; they're
  // placeholders for features that don't exist yet.
  if (isComingSoon) {
    const ariaLabel = `${label} — ${t('comingSoon.badge')}`;
    return (
      <li>
        <Tooltip>
          <TooltipTrigger asChild>
            <NavLink
              to={item.to}
              onClick={onClick}
              aria-label={collapsed ? ariaLabel : ariaLabel}
              title={collapsed ? ariaLabel : undefined}
              className={({ isActive }) =>
                cn(
                  'group relative grid h-9 grid-cols-[auto_1fr_auto] items-center gap-2.5 rounded-md px-3 text-sm font-medium transition-colors',
                  'hover:bg-slate-100 dark:hover:bg-slate-800',
                  collapsed && 'flex justify-center px-0',
                  isActive ? 'bg-muted' : '',
                )
              }
            >
              <Icon className="size-4 shrink-0 text-muted-foreground/70" aria-hidden />
              {!collapsed ? (
                <>
                  <span className="truncate text-muted-foreground/70">{label}</span>
                  <Lock
                    className="size-3.5 shrink-0 text-muted-foreground/60"
                    aria-hidden
                  />
                </>
              ) : null}
            </NavLink>
          </TooltipTrigger>
          <TooltipContent side="right">
            {t('comingSoon.sidebarTooltip')}
          </TooltipContent>
        </Tooltip>
      </li>
    );
  }

  return (
    <li>
      <NavLink
        to={item.to}
        end={item.to === '/'}
        onClick={onClick}
        aria-label={collapsed ? label : undefined}
        title={collapsed ? label : undefined}
        className={({ isActive }) =>
          cn(
            'group relative flex h-9 items-center gap-2.5 rounded-md px-3 text-sm font-medium transition-colors',
            'hover:bg-slate-100 dark:hover:bg-slate-800',
            collapsed && 'justify-center px-0',
            isActive
              ? 'bg-brand-50 text-brand-700 before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[2px] before:rounded-r before:bg-brand-600 dark:bg-brand-950 dark:text-brand-300'
              : 'text-foreground/80'
          )
        }
      >
        <Icon className="size-4 shrink-0" aria-hidden />
        {!collapsed ? <span className="truncate">{label}</span> : null}
      </NavLink>
    </li>
  );
}
