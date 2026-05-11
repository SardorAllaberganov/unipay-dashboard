import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BackLink } from '@/components/shared/BackLink';
import { RoleBadge } from '@/components/shared/RoleBadge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatDate, formatRelative } from '@/lib/format';
import type { StaffMember } from '@/types/domain';
import { StaffAvatar } from '../shared/StaffAvatar';
import { StaffDetailKebab } from './StaffDetailKebab';

interface Props {
  staff: StaffMember;
  onOpenEditRole: () => void;
  onOpenEditAccess: () => void;
}

interface LocationStateShape {
  from?: string;
}

/**
 * Staff-specific detail header. Bypasses the generic `<DetailHeader>` because the staff
 * identity row carries heavier chrome (avatar + name + email + 2 badges + kebab) than
 * other detail surfaces and needs a layout that works at 320px without wrapping the
 * kebab into a weird position.
 *
 * Layout:
 *   Row 1: back link
 *   Row 2: [avatar] | [name(h1) + kebab][email][badges wrap]
 *   Row 3: chips (registered / last login / department count / invite-sent)
 *
 * The kebab is pinned to the top-right of the title block so it's always reachable
 * with the thumb on mobile and aligned with the title baseline on desktop.
 */
export function StaffDetailHeader({
  staff,
  onOpenEditRole,
  onOpenEditAccess,
}: Props) {
  const { t } = useTranslation();
  const location = useLocation();
  const backTo =
    (location.state as LocationStateShape | null)?.from ?? '/staff';
  const deptCount = staff.departmentIds.length;
  const isAllAccess = deptCount === 0;

  return (
    <header className="mb-6 flex flex-col gap-3">
      <BackLink to={backTo} pluralName={t('staff.backPlural')} />

      <div className="flex items-start gap-3">
        <StaffAvatar
          fullName={staff.fullName}
          email={staff.email}
          size="lg"
          className="shrink-0"
        />
        <div className="min-w-0 flex-1 space-y-2">
          {/* Title + kebab — kebab pinned top-right so it's always at the same screen
             position regardless of name length or viewport width. */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h1 className="truncate text-page-title text-foreground">
                {staff.fullName || staff.email}
              </h1>
              <p className="truncate text-sm text-muted-foreground">
                {staff.email}
              </p>
            </div>
            <div className="shrink-0">
              <StaffDetailKebab
                staff={staff}
                onOpenEditRole={onOpenEditRole}
                onOpenEditAccess={onOpenEditAccess}
              />
            </div>
          </div>

          {/* Badges always live in the title column so they wrap below the title
             at any viewport — never get cut off behind the kebab or pushed off-screen. */}
          <div className="flex flex-wrap items-center gap-2">
            <RoleBadge role={staff.role} />
            <StatusBadge variant={staff.status} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center rounded-md bg-muted/60 px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {t('staff.detail.registered', { date: formatDate(staff.createdAt) })}
        </span>
        {staff.lastLoginAt ? (
          <span className="inline-flex items-center rounded-md bg-muted/60 px-2 py-0.5 text-xs font-medium text-muted-foreground tabular">
            {t('staff.detail.lastLoginRelative', {
              relative: formatRelative(staff.lastLoginAt),
            })}
          </span>
        ) : null}
        <span className="inline-flex items-center rounded-md bg-muted/60 px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {isAllAccess
            ? t('staff.access.summaryAll')
            : t('staff.list.departmentsAccessCount', { count: deptCount })}
        </span>
        {staff.status === 'pending' && staff.invitedAt ? (
          <span className="inline-flex items-center rounded-md bg-warning-50 px-2 py-0.5 text-xs font-medium text-warning-foreground tabular">
            {t('staff.chips.inviteSent', {
              relative: formatRelative(staff.invitedAt),
            })}
          </span>
        ) : null}
      </div>
    </header>
  );
}
