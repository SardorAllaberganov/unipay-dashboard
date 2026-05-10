import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-breakpoint';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import type { Department } from '@/types/domain';
import { DepartmentTree } from '../components/DepartmentTree';
import { DepartmentDetailPanel } from '../components/DepartmentDetailPanel';
import { useDepartments, descendantIds } from '../hooks/useDepartments';
import { useDepartmentMutations } from '../hooks/useDepartmentMutations';

export default function DepartmentsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const departmentsQuery = useDepartments();
  const { remove } = useDepartmentMutations();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);

  const items = departmentsQuery.data?.items ?? [];
  const selected = items.find((d) => d.id === selectedId) ?? null;

  const goAdd = (parentId: string | null) => {
    const path = parentId
      ? `/organization/departments/new?parentId=${encodeURIComponent(parentId)}`
      : '/organization/departments/new';
    navigate(path);
  };

  const onDelete = async (reason?: string) => {
    if (!deleteTarget) return;
    try {
      await remove.mutateAsync(deleteTarget.id);
      toast.success(t('organization.departments.deletedToast'));
      if (selectedId === deleteTarget.id) setSelectedId(null);
      setDeleteTarget(null);
    } catch {
      toast.error(t('organization.departments.deleteErrorToast'));
    }
    void reason;
  };

  const deleteImpact = deleteTarget
    ? deleteImpactOf(items, deleteTarget.id)
    : { childrenCount: 0, studentsTotal: 0 };
  const requireReasonOnDelete = deleteImpact.childrenCount > 0;

  return (
    <div className="flex flex-col gap-4 md:grid md:h-[calc(100dvh-220px)] md:grid-cols-[2fr_3fr]">
      <div className="flex h-[70dvh] min-h-0 flex-col rounded-xl border border-border bg-card p-3 md:h-auto">
        <DepartmentTree
          selectedId={selectedId}
          onSelect={(dept) => setSelectedId(dept?.id ?? null)}
          onAdd={goAdd}
          onEdit={(dept) => setSelectedId(dept.id)}
          onDelete={(dept) => setDeleteTarget(dept)}
        />
      </div>

      {/* Desktop: detail panel on the right */}
      {!isMobile ? (
        <div className="hidden min-h-0 rounded-xl border border-border bg-card p-5 md:block">
          {selected ? (
            <DepartmentDetailPanel
              department={selected}
              onDelete={() => setDeleteTarget(selected)}
              onClose={() => setSelectedId(null)}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              {t('organization.departments.detailEmptyHint')}
            </div>
          )}
        </div>
      ) : null}

      {/* Mobile: detail panel in a bottom Sheet */}
      {isMobile ? (
        <Sheet
          open={!!selected}
          onOpenChange={(open) => !open && setSelectedId(null)}
        >
          <SheetContent side="bottom" className="flex h-[90dvh] flex-col">
            <SheetHeader className="shrink-0">
              <SheetTitle>
                {selected
                  ? t('organization.departments.detailMobileTitle', {
                      name: selected.name.ru,
                    })
                  : ''}
              </SheetTitle>
            </SheetHeader>
            {selected ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 self-start"
                onClick={() => {
                  goAdd(selected.id);
                  setSelectedId(null);
                }}
              >
                <Plus className="size-4" aria-hidden />
                {t('organization.departments.addChildAria')}
              </Button>
            ) : null}
            <div className="min-h-0 flex-1">
              {selected ? (
                <DepartmentDetailPanel
                  department={selected}
                  onDelete={() => setDeleteTarget(selected)}
                  onClose={() => setSelectedId(null)}
                />
              ) : null}
            </div>
          </SheetContent>
        </Sheet>
      ) : null}

      {deleteTarget ? (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          title={t('organization.departments.deleteTitle')}
          description={
            requireReasonOnDelete
              ? t('organization.departments.deleteCascadeBody', {
                  name: deleteTarget.name.ru,
                  children: deleteImpact.childrenCount,
                  students: deleteImpact.studentsTotal,
                })
              : t('organization.departments.deleteBody', {
                  name: deleteTarget.name.ru,
                })
          }
          destructive
          requireReason={requireReasonOnDelete}
          loading={remove.isPending}
          onConfirm={onDelete}
          confirmLabel={t('common.actions.delete')}
        />
      ) : null}
    </div>
  );
}

function deleteImpactOf(
  items: Department[],
  id: string
): { childrenCount: number; studentsTotal: number } {
  const subtree = descendantIds(items, id);
  let childrenCount = 0;
  let studentsTotal = 0;
  for (const d of items) {
    if (!subtree.has(d.id)) continue;
    if (d.id !== id) childrenCount += 1;
    if (d.type === 'group') studentsTotal += d.studentCount;
  }
  return { childrenCount, studentsTotal };
}
