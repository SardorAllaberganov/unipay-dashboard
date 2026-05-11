import { useState, type ReactNode } from 'react';
import { MoreVertical } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useIsMobile } from '@/hooks/use-breakpoint';
import { cn } from '@/lib/utils';
import { useSession } from '@/lib/auth';
import type { Role, StaffMember } from '@/types/domain';
import {
  useReactivateStaff,
  useResendInvite,
  useResetStaffPassword,
} from '../../hooks/useStaffMutations';
import { DeactivateStaffDialog } from '../dialogs/DeactivateStaffDialog';
import { DeleteInviteDialog } from '../dialogs/DeleteInviteDialog';
import { DeleteAccountDialog } from '../dialogs/DeleteAccountDialog';
import { TransferOwnershipDialog } from '../dialogs/TransferOwnershipDialog';

interface Props {
  staff: StaffMember;
  /** Opens the role dialog on the parent (the same dialog instance the page hosts). */
  onOpenEditRole: () => void;
  onOpenEditAccess: () => void;
  className?: string;
}

const PERMISSIONED_ROLES: Role[] = ['owner', 'finance_manager'];

type ActionKey =
  | 'editRole'
  | 'editAccess'
  | 'resetPassword'
  | 'resendInvite'
  | 'cancelInvite'
  | 'deactivate'
  | 'reactivate'
  | 'transferOwnership'
  | 'deleteAccount';

export function StaffDetailKebab({
  staff,
  onOpenEditRole,
  onOpenEditAccess,
  className,
}: Props) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const session = useSession();
  const currentRole = session?.profile.role ?? 'viewer';
  const currentUserId = session?.profile.id;
  const canManage = PERMISSIONED_ROLES.includes(currentRole);
  const isSelf = !!currentUserId && currentUserId === staff.id;
  const currentUserIsOwner = currentRole === 'owner';

  const [open, setOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [cancelInviteOpen, setCancelInviteOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);

  const reactivateMutation = useReactivateStaff();
  const resetMutation = useResetStaffPassword();
  const resendMutation = useResendInvite();

  const isPending = staff.status === 'pending';
  const isInactive = staff.status === 'inactive';

  function close() {
    setOpen(false);
  }

  function handle(action: ActionKey) {
    close();
    switch (action) {
      case 'editRole':
        onOpenEditRole();
        break;
      case 'editAccess':
        onOpenEditAccess();
        break;
      case 'resetPassword':
        setResetOpen(true);
        break;
      case 'resendInvite':
        void (async () => {
          try {
            await resendMutation.mutateAsync(staff.id);
            toast.success(t('staff.resendInvite.successToast'));
          } catch {
            toast.error(t('staff.resendInvite.errorToast'));
          }
        })();
        break;
      case 'cancelInvite':
        setCancelInviteOpen(true);
        break;
      case 'deactivate':
        setDeactivateOpen(true);
        break;
      case 'reactivate':
        void (async () => {
          try {
            await reactivateMutation.mutateAsync(staff.id);
            toast.success(t('staff.reactivate.successToast'));
          } catch {
            toast.error(t('staff.reactivate.errorToast'));
          }
        })();
        break;
      case 'transferOwnership':
        setTransferOpen(true);
        break;
      case 'deleteAccount':
        setDeleteAccountOpen(true);
        break;
    }
  }

  type Item = {
    key: ActionKey;
    label: string;
    visible: boolean;
    disabled?: boolean;
    disabledReason?: string;
    destructive?: boolean;
  };

  const items: Item[] = [
    {
      key: 'editRole',
      label: t('staff.detail.kebab.editRole') !== 'staff.detail.kebab.editRole'
        ? t('staff.detail.kebab.editRole')
        : t('staff.kebab.editRole'),
      visible: !isPending,
      disabled: !canManage,
      disabledReason: !canManage ? t('staff.row.tooltip.needsRole') : undefined,
    },
    {
      key: 'editAccess',
      label: t('staff.kebab.editAccess'),
      visible: !isPending,
      disabled: !canManage,
      disabledReason: !canManage ? t('staff.row.tooltip.needsRole') : undefined,
    },
    {
      key: 'resetPassword',
      label: t('staff.kebab.resetPassword'),
      visible: !isPending,
      disabled: !canManage,
      disabledReason: !canManage ? t('staff.row.tooltip.needsRole') : undefined,
    },
    {
      key: 'resendInvite',
      label: t('staff.kebab.resendInvite'),
      visible: isPending,
      disabled: !canManage,
      disabledReason: !canManage ? t('staff.row.tooltip.needsRole') : undefined,
    },
    {
      key: 'cancelInvite',
      label: t('staff.kebab.cancelInvite'),
      visible: isPending,
      disabled: !canManage,
      disabledReason: !canManage ? t('staff.row.tooltip.needsRole') : undefined,
      destructive: true,
    },
    {
      key: 'reactivate',
      label: t('staff.kebab.reactivate'),
      visible: isInactive,
      disabled: !canManage,
      disabledReason: !canManage ? t('staff.row.tooltip.needsRole') : undefined,
    },
    {
      key: 'deactivate',
      label: t('staff.kebab.deactivate'),
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
      key: 'transferOwnership',
      label: t('staff.kebab.transferOwnership'),
      // Only visible when the current user is Owner AND we're viewing someone else
      // who's currently active and not already Owner.
      visible:
        currentUserIsOwner &&
        !staff.isOwner &&
        !isSelf &&
        staff.status === 'active',
      destructive: true,
    },
    {
      key: 'deleteAccount',
      label: t('staff.kebabExtended.deleteAccount'),
      visible: !isPending,
      disabled: !canManage || staff.isOwner || isSelf,
      disabledReason: staff.isOwner
        ? t('staff.row.tooltip.ownerCannotDelete')
        : isSelf
          ? t('staff.row.tooltip.selfCannotAct')
          : !canManage
            ? t('staff.row.tooltip.needsRole')
            : undefined,
      destructive: true,
    },
  ];

  const visibleItems = items.filter((i) => i.visible);

  const triggerLabel = t('staff.kebab.openMenu');

  // Insert separators before the first destructive item and before transferOwnership.
  const itemNodes: ReactNode = visibleItems.map((item, idx) => {
    const prev = visibleItems[idx - 1];
    const needsSeparator =
      idx > 0 &&
      ((item.destructive && !prev?.destructive) ||
        item.key === 'transferOwnership' ||
        item.key === 'deleteAccount');
    return (
      <div key={item.key}>
        {needsSeparator ? <DropdownMenuSeparator /> : null}
        {item.disabled && item.disabledReason ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuItem
                disabled
                onSelect={(e) => e.preventDefault()}
                className={cn(
                  item.destructive && 'text-danger-700 focus:text-danger-700'
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
              item.destructive && 'text-danger-700 focus:text-danger-700'
            )}
          >
            {item.label}
          </DropdownMenuItem>
        )}
      </div>
    );
  });

  const mobileSheet = (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="bottom" className="max-h-[70dvh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t('staff.kebab.actionsLabel')}</SheetTitle>
        </SheetHeader>
        <ul className="mt-3 space-y-1">
          {visibleItems.map((item) => (
            <li key={item.key}>
              <button
                type="button"
                onClick={() => handle(item.key)}
                disabled={item.disabled}
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
  );

  return (
    <>
      {isMobile ? (
        <>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn('size-9 p-0', className)}
            aria-label={triggerLabel}
            onClick={() => setOpen(true)}
          >
            <MoreVertical className="size-4" aria-hidden />
          </Button>
          {mobileSheet}
        </>
      ) : (
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn('size-9 p-0', className)}
              aria-label={triggerLabel}
            >
              <MoreVertical className="size-4" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{t('staff.kebab.actionsLabel')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {itemNodes}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <DeactivateStaffDialog
        open={deactivateOpen}
        onOpenChange={setDeactivateOpen}
        staff={staff}
        onSuccess={() => toast.success(t('staff.deactivate.successToast'))}
      />

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title={t('staff.resetPassword.title')}
        description={t('staff.resetPassword.body')}
        confirmLabel={t('staff.resetPassword.confirmCta')}
        loading={resetMutation.isPending}
        onConfirm={() => {
          void (async () => {
            try {
              await resetMutation.mutateAsync(staff.id);
              toast.success(t('staff.resetPassword.successToast'));
              setResetOpen(false);
            } catch {
              toast.error(t('staff.resetPassword.errorToast'));
            }
          })();
        }}
      />

      <DeleteInviteDialog
        open={cancelInviteOpen}
        onOpenChange={setCancelInviteOpen}
        staff={staff}
        onSuccess={() => toast.success(t('staff.cancelInvite.successToast'))}
      />

      <TransferOwnershipDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        staff={staff}
      />

      <DeleteAccountDialog
        open={deleteAccountOpen}
        onOpenChange={setDeleteAccountOpen}
        staff={staff}
      />
    </>
  );
}
