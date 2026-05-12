import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye, KeyRound, MoreHorizontal, RefreshCcw, Trash2 } from 'lucide-react';
import { DataTable, type DataTableState } from '@/components/shared/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { WriteButton } from '@/components/unipay/WriteButton';
import { useNetworkState } from '@/hooks/useNetworkState';
import { formatDate, formatRelative } from '@/lib/format';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import type { ApiKey } from '@/types/domain';
import {
  useApiKeys,
  useDeleteApiKey,
  useRegenerateApiKey,
  useRevealApiKey,
} from '../hooks/useApiKeys';
import { GenerateApiKeyDialog } from './GenerateApiKeyDialog';
import { PasswordConfirmDialog } from './PasswordConfirmDialog';
import { CopyableTextRow } from './CopyableTextRow';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function ApiKeysCard() {
  const { t } = useTranslation();
  const online = useNetworkState();
  const { data, isPending, isError, refetch } = useApiKeys();
  const reveal = useRevealApiKey();
  const regenerate = useRegenerateApiKey();
  const remove = useDeleteApiKey();

  const items = useMemo(() => data?.items ?? [], [data]);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [revealTarget, setRevealTarget] = useState<ApiKey | null>(null);
  const [regenTarget, setRegenTarget] = useState<ApiKey | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiKey | null>(null);
  const [revealedPlaintext, setRevealedPlaintext] = useState<string | null>(null);
  const [regeneratedPlaintext, setRegeneratedPlaintext] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const state: DataTableState = useMemo(() => {
    if (isPending) return 'loading';
    if (isError) return online ? 'error' : 'offline';
    if (!online && items.length === 0) return 'offline';
    if (items.length === 0) return 'empty';
    return 'data';
  }, [isPending, isError, online, items.length]);

  const columns = useMemo<ColumnDef<ApiKey, unknown>[]>(
    () => [
      {
        id: 'name',
        header: () => t('settings.api.cols.name'),
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-foreground">{row.original.name}</p>
            <p className="font-mono text-xs tabular text-muted-foreground">
              {row.original.prefix}…
            </p>
          </div>
        ),
      },
      {
        id: 'permissions',
        header: () => t('settings.api.cols.permissions'),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {t('settings.api.permissionsCount', { count: row.original.permissions.length })}
          </span>
        ),
      },
      {
        id: 'createdAt',
        header: () => t('settings.api.cols.createdAt'),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground tabular">
            {formatDate(row.original.createdAt)}
          </span>
        ),
        meta: { headerClassName: 'whitespace-nowrap', cellClassName: 'whitespace-nowrap' },
      },
      {
        id: 'lastUsedAt',
        header: () => t('settings.api.cols.lastUsedAt'),
        cell: ({ row }) =>
          row.original.lastUsedAt ? (
            <span className="text-sm text-muted-foreground tabular">
              {formatRelative(row.original.lastUsedAt)}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">{t('settings.api.neverUsed')}</span>
          ),
        meta: { headerClassName: 'whitespace-nowrap', cellClassName: 'whitespace-nowrap' },
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">{t('common.actions.actions')}</span>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={t('settings.api.rowMenuAria', { name: row.original.name })}
                >
                  <MoreHorizontal className="size-4" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setRevealTarget(row.original)}>
                  <Eye className="size-4" aria-hidden />
                  {t('settings.api.revealCta')}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setRegenTarget(row.original)}>
                  <RefreshCcw className="size-4" aria-hidden />
                  {t('settings.api.regenerateCta')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => setDeleteTarget(row.original)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="size-4" aria-hidden />
                  {t('settings.api.deleteCta')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
        meta: { headerClassName: 'w-[1%]', cellClassName: 'pr-3' },
      },
    ],
    [t],
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <CardTitle>{t('settings.api.title')}</CardTitle>
            <p className="text-sm text-muted-foreground">{t('settings.api.subtitle')}</p>
          </div>
          <WriteButton onClick={() => setGenerateOpen(true)}>
            <KeyRound className="size-4" aria-hidden />
            {t('settings.api.newKeyCta')}
          </WriteButton>
        </div>
      </CardHeader>
      <CardContent>
        <DataTable<ApiKey>
          columns={columns}
          data={items}
          state={state}
          onRetry={() => void refetch()}
          emptyTitle={t('settings.api.emptyTitle')}
          emptyDescription={t('settings.api.emptyBody')}
          rowKey={(row) => row.id}
          mobileCardRender={(row) => (
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{row.name}</p>
                  <p className="font-mono text-xs tabular text-muted-foreground">
                    {row.prefix}…
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('settings.api.permissionsCount', { count: row.permissions.length })}
              </p>
              <p className="text-sm text-muted-foreground tabular">
                {t('settings.api.cols.createdAt')}: {formatDate(row.createdAt)}
              </p>
              {row.lastUsedAt ? (
                <p className="text-sm text-muted-foreground tabular">
                  {t('settings.api.cols.lastUsedAt')}: {formatRelative(row.lastUsedAt)}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2 pt-1">
                <Button size="sm" variant="outline" onClick={() => setRevealTarget(row)}>
                  <Eye className="size-3.5" aria-hidden />
                  {t('settings.api.revealCta')}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setRegenTarget(row)}>
                  <RefreshCcw className="size-3.5" aria-hidden />
                  {t('settings.api.regenerateCta')}
                </Button>
                <WriteButton
                  size="sm"
                  variant="destructive"
                  onClick={() => setDeleteTarget(row)}
                >
                  <Trash2 className="size-3.5" aria-hidden />
                  {t('settings.api.deleteCta')}
                </WriteButton>
              </div>
            </div>
          )}
        />
      </CardContent>

      <GenerateApiKeyDialog open={generateOpen} onOpenChange={setGenerateOpen} />

      {/* Reveal — password-confirm */}
      <PasswordConfirmDialog
        open={!!revealTarget && !revealedPlaintext}
        onOpenChange={(o) => {
          if (!o) {
            setRevealTarget(null);
            setServerError(null);
          }
        }}
        title={t('settings.api.revealTitle')}
        description={t('settings.api.revealDescription', { name: revealTarget?.name ?? '' })}
        confirmLabel={t('settings.api.revealConfirm')}
        loading={reveal.isPending}
        errorMessage={serverError ?? undefined}
        onConfirm={({ password }) => {
          if (!revealTarget) return;
          setServerError(null);
          reveal.mutate(
            { id: revealTarget.id, password },
            {
              onSuccess: (data) => setRevealedPlaintext(data.plaintext),
              onError: (err) => {
                const code = (err as { body?: { error?: { code?: string } } }).body?.error
                  ?.code;
                setServerError(
                  code === 'invalid_password'
                    ? t('settings.passwordConfirm.invalid')
                    : t('common.errors.saveFailed'),
                );
              },
            },
          );
        }}
      />
      <Dialog
        open={!!revealedPlaintext}
        onOpenChange={(o) => {
          if (!o) {
            setRevealedPlaintext(null);
            setRevealTarget(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('settings.api.revealedTitle')}</DialogTitle>
            <DialogDescription>{t('settings.api.revealedDescription')}</DialogDescription>
          </DialogHeader>
          {revealedPlaintext ? (
            <CopyableTextRow value={revealedPlaintext} />
          ) : null}
          <DialogFooter>
            <Button onClick={() => setRevealedPlaintext(null)}>
              {t('common.actions.done')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Regenerate — password-confirm + reveal new plaintext */}
      <PasswordConfirmDialog
        open={!!regenTarget && !regeneratedPlaintext}
        onOpenChange={(o) => {
          if (!o) {
            setRegenTarget(null);
            setServerError(null);
          }
        }}
        title={t('settings.api.regenerateTitle')}
        description={t('settings.api.regenerateDescription', {
          name: regenTarget?.name ?? '',
        })}
        destructive
        confirmLabel={t('settings.api.regenerateConfirm')}
        loading={regenerate.isPending}
        errorMessage={serverError ?? undefined}
        onConfirm={({ password }) => {
          if (!regenTarget) return;
          setServerError(null);
          regenerate.mutate(
            { id: regenTarget.id, password },
            {
              onSuccess: (data) => setRegeneratedPlaintext(data.plaintext),
              onError: (err) => {
                const code = (err as { body?: { error?: { code?: string } } }).body?.error
                  ?.code;
                setServerError(
                  code === 'invalid_password'
                    ? t('settings.passwordConfirm.invalid')
                    : t('common.errors.saveFailed'),
                );
              },
            },
          );
        }}
      />
      <Dialog
        open={!!regeneratedPlaintext}
        onOpenChange={(o) => {
          if (!o) {
            setRegeneratedPlaintext(null);
            setRegenTarget(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('settings.api.regeneratedTitle')}</DialogTitle>
            <DialogDescription>{t('settings.api.regeneratedDescription')}</DialogDescription>
          </DialogHeader>
          {regeneratedPlaintext ? (
            <CopyableTextRow value={regeneratedPlaintext} />
          ) : null}
          <DialogFooter>
            <Button onClick={() => setRegeneratedPlaintext(null)}>
              {t('common.actions.done')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete — reason ≥20 */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
        title={t('settings.api.deleteTitle', { name: deleteTarget?.name ?? '' })}
        description={t('settings.api.deleteDescription')}
        destructive
        requireReason
        confirmLabel={t('settings.api.deleteConfirm')}
        loading={remove.isPending}
        onConfirm={(reason) => {
          if (!deleteTarget) return;
          remove.mutate(
            { id: deleteTarget.id, reason: reason ?? '' },
            { onSuccess: () => setDeleteTarget(null) },
          );
        }}
      />
    </Card>
  );
}
