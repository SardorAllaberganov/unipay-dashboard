import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Check, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ResponsiveSheet } from '@/components/shared/ResponsiveSheet';
import { RoleBadge } from '@/components/shared/RoleBadge';
import { WriteButton } from '@/components/unipay/WriteButton';
import { cn } from '@/lib/utils';
import { ROLE_PERMISSIONS } from '@/types/domain';
import type {
  Role,
  StaffMember,
  StaffPermission,
  StaffResource,
} from '@/types/domain';
import { useUpdateStaffRole } from '../../hooks/useStaffMutations';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: StaffMember;
}

const ASSIGNABLE_ROLES: Role[] = ['owner', 'finance_manager', 'operator', 'viewer'];
const REASON_MIN = 20;

type Capability = 'read' | 'write' | 'destructive';

interface DiffEntry {
  resource: StaffResource;
  capability: Capability;
}

/**
 * Flat (resource, capability) pairs of permissions added or removed when going
 * current → next. Flattening simplifies the visual: a single list per direction
 * instead of nested resource-blocks with sub-lists.
 */
function flatDiff(
  current: StaffPermission[],
  next: StaffPermission[]
): { added: DiffEntry[]; removed: DiffEntry[] } {
  const byResourceCurr = new Map(current.map((p) => [p.resource, p]));
  const byResourceNext = new Map(next.map((p) => [p.resource, p]));
  const resources = Array.from(
    new Set([...byResourceCurr.keys(), ...byResourceNext.keys()])
  );
  const added: DiffEntry[] = [];
  const removed: DiffEntry[] = [];
  const blank = { read: false, write: false, destructive: false } as const;
  for (const r of resources) {
    const c = byResourceCurr.get(r) ?? { resource: r, ...blank };
    const n = byResourceNext.get(r) ?? { resource: r, ...blank };
    for (const cap of ['read', 'write', 'destructive'] as Capability[]) {
      if (!c[cap] && n[cap]) added.push({ resource: r, capability: cap });
      if (c[cap] && !n[cap]) removed.push({ resource: r, capability: cap });
    }
  }
  return { added, removed };
}

export function EditRoleDialog({ open, onOpenChange, staff }: Props) {
  const { t } = useTranslation();
  const mutation = useUpdateStaffRole();
  const [nextRole, setNextRole] = useState<Role>(staff.role);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) {
      setNextRole(staff.role);
      setReason('');
    }
  }, [open, staff.role]);

  const currentPerms = useMemo(() => ROLE_PERMISSIONS[staff.role], [staff.role]);
  const nextPerms = useMemo(() => ROLE_PERMISSIONS[nextRole], [nextRole]);
  const { added, removed } = useMemo(
    () => flatDiff(currentPerms, nextPerms),
    [currentPerms, nextPerms]
  );

  const sameRole = nextRole === staff.role;
  const reasonOk = reason.trim().length >= REASON_MIN;
  const canSubmit = !sameRole && reasonOk;
  const reasonCount = reason.trim().length;

  const onConfirm = async (): Promise<void> => {
    try {
      await mutation.mutateAsync({ id: staff.id, role: nextRole, reason });
      toast.success(t('staff.editRole.successToast'));
      onOpenChange(false);
    } catch {
      toast.error(t('staff.editRole.errorToast'));
    }
  };

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('staff.editRole.previewTitle')}
      description={t('staff.editRole.previewBody')}
      contentClassName="md:max-w-2xl"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            {t('common.actions.cancel')}
          </Button>
          <WriteButton
            type="button"
            onClick={() => void onConfirm()}
            disabled={!canSubmit}
            loading={mutation.isPending}
          >
            {t('staff.editRole.confirmCta')}
          </WriteButton>
        </>
      }
    >
      <div className="space-y-5">
        {/* Current role banner — anchors the user. */}
        <div className="flex items-center gap-3 rounded-md bg-muted/40 px-3 py-2.5">
          <span className="text-sm text-muted-foreground">
            {t('staff.editRole.currentLabel')}:
          </span>
          <RoleBadge role={staff.role} />
          <span className="ml-auto truncate text-sm text-muted-foreground">
            {staff.fullName || staff.email}
          </span>
        </div>

        {/* Role picker — large tap targets, inline descriptions, no nested dropdown. */}
        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-medium text-foreground">
            {t('staff.editRole.newLabel')}
          </legend>
          <RadioGroup
            value={nextRole}
            onValueChange={(v) => setNextRole(v as Role)}
          >
            {ASSIGNABLE_ROLES.map((r) => {
              const isSelected = nextRole === r;
              const isCurrent = staff.role === r;
              return (
                <label
                  key={r}
                  htmlFor={`edit-role-${r}`}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors',
                    'focus-within:ring-2 focus-within:ring-brand-600 focus-within:ring-offset-1',
                    isSelected
                      ? 'border-brand-600 bg-brand-50 dark:bg-brand-950'
                      : 'border-border hover:bg-muted/40'
                  )}
                >
                  <RadioGroupItem
                    id={`edit-role-${r}`}
                    value={r}
                    className="mt-1"
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <RoleBadge role={r} />
                      {isCurrent ? (
                        <span className="text-sm text-muted-foreground">
                          ({t('staff.editRole.currentLabel').toLowerCase()})
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t(`staff.role.descriptions.${r}`)}
                    </p>
                  </div>
                </label>
              );
            })}
          </RadioGroup>
        </fieldset>

        {/* Live diff — appears only when there's a meaningful change. */}
        {!sameRole && (added.length > 0 || removed.length > 0) ? (
          <div className="space-y-3 rounded-md border border-border bg-muted/20 p-3">
            <p className="text-sm font-medium text-foreground">
              {t('staff.editRole.previewBody')}
            </p>
            {added.length > 0 ? (
              <div>
                <p className="mb-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-success-700 dark:text-success-400">
                  <Check className="size-4" aria-hidden />
                  {t('staff.editRole.addedTitle')} ({added.length})
                </p>
                <ul className="ml-5 list-disc space-y-0.5 text-sm text-foreground marker:text-success-700">
                  {added.map((d) => (
                    <li key={`a-${d.resource}-${d.capability}`}>
                      {t(`staff.role.matrix.resources.${d.resource}`)}
                      {' — '}
                      <span className="text-muted-foreground">
                        {t(`staff.role.matrix.${d.capability}`)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {removed.length > 0 ? (
              <div>
                <p className="mb-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-danger-700">
                  <Minus className="size-4" aria-hidden />
                  {t('staff.editRole.removedTitle')} ({removed.length})
                </p>
                <ul className="ml-5 list-disc space-y-0.5 text-sm text-foreground marker:text-danger-700">
                  {removed.map((d) => (
                    <li key={`r-${d.resource}-${d.capability}`}>
                      {t(`staff.role.matrix.resources.${d.resource}`)}
                      {' — '}
                      <span className="text-muted-foreground">
                        {t(`staff.role.matrix.${d.capability}`)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}

        {sameRole ? (
          <p className="text-sm text-muted-foreground">
            {t('staff.editRole.noChange')}
          </p>
        ) : null}

        {/* Reason — always visible so the user sees the cost upfront. */}
        <div className="space-y-1.5">
          <Label htmlFor="edit-role-reason">
            {t('staff.editRole.reasonLabel')}
          </Label>
          <Textarea
            id="edit-role-reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('staff.editRole.reasonPlaceholder')}
            aria-describedby="edit-role-reason-counter"
            aria-invalid={!reasonOk && reasonCount > 0}
            disabled={sameRole}
          />
          <p
            id="edit-role-reason-counter"
            className={cn(
              'text-sm tabular',
              sameRole
                ? 'text-muted-foreground/60'
                : reasonOk
                  ? 'text-success-700'
                  : 'text-muted-foreground'
            )}
          >
            {reasonCount}/{REASON_MIN}
          </p>
        </div>
      </div>
    </ResponsiveSheet>
  );
}
