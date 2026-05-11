import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { RoleBadge } from '@/components/shared/RoleBadge';
import { WriteButton } from '@/components/unipay/WriteButton';
import { useDepartments } from '@/features/organization/hooks/useDepartments';
import { ROLE_PERMISSIONS } from '@/types/domain';
import type { StaffMember, StaffResource } from '@/types/domain';
import { EditRoleDialog } from '../dialogs/EditRoleDialog';
import { EditAccessDialog } from '../dialogs/EditAccessDialog';

interface Props {
  staff: StaffMember;
}

const RESOURCES: StaffResource[] = [
  'students',
  'payments',
  'reports',
  'staff',
  'settings',
  'audit',
];

function Bool({ on, label }: { on: boolean; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-sm text-muted-foreground"
      aria-label={`${label}: ${on ? 'yes' : 'no'}`}
    >
      {on ? (
        <Check className="size-4 text-success-700" aria-hidden />
      ) : (
        <X className="size-4 text-muted-foreground/50" aria-hidden />
      )}
    </span>
  );
}

export function RoleAndPermissionsTab({ staff }: Props) {
  const { t } = useTranslation();
  const { data: depts } = useDepartments();
  const totalDepts = depts?.items?.length ?? 0;
  const accessCount = staff.departmentIds.length;
  const isAllAccess = accessCount === 0;

  const [editRoleOpen, setEditRoleOpen] = useState(false);
  const [editAccessOpen, setEditAccessOpen] = useState(false);

  const matrix = ROLE_PERMISSIONS[staff.role];

  // Map selected dept ids to their display names.
  const deptLabelsById = new Map(
    depts?.items?.map((d) => [d.id, d.name.ru]) ?? []
  );

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {t('staff.role.title')}
            </p>
            <RoleBadge role={staff.role} />
            <p className="max-w-2xl text-sm text-muted-foreground">
              {t(`staff.role.descriptions.${staff.role}`)}
            </p>
          </div>
          <WriteButton
            type="button"
            variant="outline"
            onClick={() => setEditRoleOpen(true)}
          >
            {t('staff.role.editButton')}
          </WriteButton>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="mb-3 text-sm font-medium text-foreground">
          {t('staff.role.matrix.title')}
        </h3>
        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">
                  {/* Resource column header — intentionally empty for visual balance */}
                </th>
                <th className="px-3 py-2 text-center font-medium">
                  {t('staff.role.matrix.read')}
                </th>
                <th className="px-3 py-2 text-center font-medium">
                  {t('staff.role.matrix.write')}
                </th>
                <th className="px-3 py-2 text-center font-medium">
                  {t('staff.role.matrix.destructive')}
                </th>
              </tr>
            </thead>
            <tbody>
              {RESOURCES.map((res) => {
                const perm = matrix.find((p) => p.resource === res) ?? {
                  resource: res,
                  read: false,
                  write: false,
                  destructive: false,
                };
                return (
                  <tr key={res} className="border-t border-border">
                    <td className="px-3 py-2 font-medium text-foreground">
                      {t(`staff.role.matrix.resources.${res}`)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Bool on={perm.read} label={t('staff.role.matrix.read')} />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Bool on={perm.write} label={t('staff.role.matrix.write')} />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Bool
                        on={perm.destructive}
                        label={t('staff.role.matrix.destructive')}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {t('staff.access.title')}
            </p>
            <p className="text-sm text-muted-foreground">
              {isAllAccess
                ? t('staff.access.summaryAll')
                : t('staff.access.summary', {
                    count: accessCount,
                    total: totalDepts,
                  })}
            </p>
            {!isAllAccess && staff.departmentIds.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-2">
                {staff.departmentIds.map((id) => (
                  <li
                    key={id}
                    className="inline-flex items-center rounded-md bg-muted/60 px-2 py-1 text-sm font-medium text-foreground"
                  >
                    {deptLabelsById.get(id) ?? id}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <WriteButton
            type="button"
            variant="outline"
            onClick={() => setEditAccessOpen(true)}
          >
            {t('staff.access.editButton')}
          </WriteButton>
        </div>
      </Card>

      <EditRoleDialog
        open={editRoleOpen}
        onOpenChange={setEditRoleOpen}
        staff={staff}
      />
      <EditAccessDialog
        open={editAccessOpen}
        onOpenChange={setEditAccessOpen}
        staff={staff}
      />
    </div>
  );
}
