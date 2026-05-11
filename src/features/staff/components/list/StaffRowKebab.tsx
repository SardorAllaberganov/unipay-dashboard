import { useState } from 'react';
import { MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-breakpoint';
import { cn } from '@/lib/utils';
import { useSession } from '@/lib/auth';
import type { Role, StaffMember } from '@/types/domain';
import { DeactivateStaffDialog } from '../dialogs/DeactivateStaffDialog';
import { DeleteInviteDialog } from '../dialogs/DeleteInviteDialog';

/**
 * The kebab rendered inside list rows (desktop + mobile cards). Limited to the row-level
 * actions the spec calls out for §7.1 — Открыть профиль / Изменить роль / Деактивировать /
 * Сбросить пароль / Удалить. The full admin kebab (with TransferOwnership, DeleteAccount,
 * EditContact, etc.) lives on the detail page as `<StaffDetailKebab>`.
 */
const PERMISSIONED_ROLES: Role[] = ['owner', 'finance_manager'];

interface Props {
  staff: StaffMember;
  /** Pass the session user id so 'destructive on self' can be disabled. */
  currentUserId?: string;
}

type RowAction =
  | 'open'
  | 'editRole'
  | 'deactivate'
  | 'resetPassword'
  | 'cancelInvite';

export function StaffRowKebab({ staff, currentUserId }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const session = useSession();
  const currentRole = session?.profile.role ?? 'viewer';
  const canManage = PERMISSIONED_ROLES.includes(currentRole);
  const isSelf =
    !!currentUserId && currentUserId === staff.id;

  const [open, setOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [cancelInviteOpen, setCancelInviteOpen] = useState(false);

  const isPending = staff.status === 'pending';
  const isInactive = staff.status === 'inactive';

  const items: Array<{
    key: RowAction;
    label: string;
    visible: boolean;
    disabled?: boolean;
    disabledReason?: string;
    destructive?: boolean;
  }> = [
    {
      key: 'open',
      label: t('staff.list.rowActions.open'),
      visible: true,
    },
    {
      key: 'editRole',
      label: t('staff.list.rowActions.editRole'),
      visible: !isPending,
      disabled: !canManage,
      disabledReason: !canManage ? t('staff.row.tooltip.needsRole') : undefined,
    },
    {
      key: 'resetPassword',
      label: t('staff.list.rowActions.resetPassword'),
      visible: !isPending,
      disabled: !canManage,
      disabledReason: !canManage ? t('staff.row.tooltip.needsRole') : undefined,
    },
    {
      key: 'deactivate',
      label: t('staff.list.rowActions.deactivate'),
      visible: !isPending && !isInactive,
      disabled: !canManage || staff.isOwner || isSelf,
      disabledReason: staff.isOwner
        ? t('staff.row.tooltip.ownerCannotDeactivate')
        : isSelf
          ? t('staff.row.tooltip.selfCannotAct')
          : !canManage
            ? t('staff.row.tooltip.needsRole')
            : undefined,
      destructive: true,
    },
    {
      key: 'cancelInvite',
      label: t('staff.list.rowActions.cancelInvite'),
      visible: isPending,
      disabled: !canManage,
      disabledReason: !canManage ? t('staff.row.tooltip.needsRole') : undefined,
      destructive: true,
    },
  ];

  const visibleItems = items.filter((i) => i.visible);

  function handle(action: RowAction) {
    setOpen(false);
    switch (action) {
      case 'open':
        navigate(`/staff/${staff.id}`);
        break;
      case 'editRole':
        navigate(`/staff/${staff.id}`, { state: { autoOpen: 'editRole' } });
        break;
      case 'resetPassword':
        navigate(`/staff/${staff.id}`, { state: { autoOpen: 'resetPassword' } });
        break;
      case 'deactivate':
        setDeactivateOpen(true);
        break;
      case 'cancelInvite':
        setCancelInviteOpen(true);
        break;
    }
  }

  const triggerButton = (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="size-9 p-0"
      aria-label={t('staff.list.rowActions.openMenu')}
    >
      <MoreVertical className="size-4" aria-hidden />
    </Button>
  );

  return (
    <>
      {isMobile ? (
        <>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="size-9 p-0"
            aria-label={t('staff.list.rowActions.openMenu')}
            onClick={() => setOpen(true)}
          >
            <MoreVertical className="size-4" aria-hidden />
          </Button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent side="bottom" className="max-h-[60dvh] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>{t('staff.list.rowActions.openMenu')}</SheetTitle>
              </SheetHeader>
              <ul className="mt-3 space-y-1">
                {visibleItems.map((item) => (
                  <li key={item.key}>
                    <button
                      type="button"
                      disabled={item.disabled}
                      onClick={() => handle(item.key)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-md px-3 py-3 text-left text-sm hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-60',
                        item.destructive && 'text-danger-700'
                      )}
                    >
                      <span>{item.label}</span>
                      {item.disabled && item.disabledReason ? (
                        <span className="ml-2 text-sm text-muted-foreground">
                          {item.disabledReason}
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            </SheetContent>
          </Sheet>
        </>
      ) : (
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>{triggerButton}</DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {visibleItems.map((item, idx) => (
              <div key={item.key}>
                {idx > 0 &&
                  item.destructive &&
                  !visibleItems[idx - 1]!.destructive ? (
                  <DropdownMenuSeparator />
                ) : null}
                {item.disabled && item.disabledReason ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuItem
                        disabled
                        onSelect={(e) => e.preventDefault()}
                        className={cn(
                          item.destructive &&
                            'text-danger-700 focus:text-danger-700'
                        )}
                      >
                        {item.label}
                      </DropdownMenuItem>
                    </TooltipTrigger>
                    <TooltipContent side="left">{item.disabledReason}</TooltipContent>
                  </Tooltip>
                ) : (
                  <DropdownMenuItem
                    disabled={item.disabled}
                    onSelect={() => handle(item.key)}
                    className={cn(
                      item.destructive &&
                        'text-danger-700 focus:text-danger-700'
                    )}
                  >
                    {item.label}
                  </DropdownMenuItem>
                )}
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <DeactivateStaffDialog
        open={deactivateOpen}
        onOpenChange={setDeactivateOpen}
        staff={staff}
        onSuccess={() => toast.success(t('staff.deactivate.successToast'))}
      />
      <DeleteInviteDialog
        open={cancelInviteOpen}
        onOpenChange={setCancelInviteOpen}
        staff={staff}
        onSuccess={() => toast.success(t('staff.cancelInvite.successToast'))}
      />
    </>
  );
}
