import { useTranslation } from 'react-i18next';
import { RoleBadge } from '@/components/shared/RoleBadge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatRelative } from '@/lib/format';
import type { StaffMember } from '@/types/domain';
import { StaffAvatar } from '../shared/StaffAvatar';
import { StaffRowKebab } from './StaffRowKebab';

interface Props {
  staff: StaffMember;
  /** Current session user id — used to disable destructive items on own card. */
  currentUserId?: string;
}

export function StaffMobileCard({ staff, currentUserId }: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex items-start gap-3">
      <StaffAvatar fullName={staff.fullName} email={staff.email} />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {staff.fullName || staff.email}
            </p>
            <p className="truncate text-sm text-muted-foreground">{staff.email}</p>
          </div>
          {/*
           * Kebab stops propagation so its menu opens without triggering the parent
           * Card's row-link navigation.
           */}
          <div onClick={(e) => e.stopPropagation()} className="shrink-0">
            <StaffRowKebab staff={staff} currentUserId={currentUserId} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RoleBadge role={staff.role} />
          <StatusBadge variant={staff.status} />
        </div>
        <p className="text-sm text-muted-foreground tabular">
          {staff.lastLoginAt
            ? formatRelative(staff.lastLoginAt)
            : t('staff.list.lastLoginNever')}
        </p>
      </div>
    </div>
  );
}
