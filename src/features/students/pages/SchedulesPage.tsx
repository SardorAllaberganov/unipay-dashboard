import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileSpreadsheet, Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { BackLink } from '@/components/shared/BackLink';
import { WriteButton } from '@/components/unipay/WriteButton';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { OfflineState } from '@/components/system/OfflineState';
import { Skeleton } from '@/components/ui/skeleton';
import { useNetworkState } from '@/hooks/useNetworkState';
import { toast } from 'sonner';
import type { ScheduleTemplate } from '@/types/domain';
import {
  useDeleteTemplate,
  useDuplicateTemplate,
  useScheduleTemplates,
} from '../hooks/useScheduleTemplates';
import { TemplateCard } from '../components/schedules/TemplateCard';
import { TemplateForm } from '../components/schedules/TemplateForm';
import { ApplyTemplateDialog } from '../components/schedules/ApplyTemplateDialog';

export default function SchedulesPage() {
  const { t } = useTranslation();
  const online = useNetworkState();
  const query = useScheduleTemplates();
  const duplicate = useDuplicateTemplate();
  const items = query.data?.items ?? [];

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ScheduleTemplate | null>(null);
  const [applying, setApplying] = useState<ScheduleTemplate | null>(null);
  const [deleting, setDeleting] = useState<ScheduleTemplate | null>(null);
  const deleteTemplate = useDeleteTemplate(deleting?.id ?? '');

  let body: React.ReactNode;
  if (query.isLoading) {
    body = (
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-44" />
        <Skeleton className="h-44" />
        <Skeleton className="h-44" />
      </div>
    );
  } else if (query.isError) {
    body = online ? (
      <ErrorState onRetry={() => void query.refetch()} />
    ) : (
      <OfflineState />
    );
  } else if (items.length === 0) {
    body = (
      <EmptyState
        icon={FileSpreadsheet}
        title={t('students.schedules.emptyTitle')}
        description={t('students.schedules.emptyBody')}
        primaryAction={{
          label: t('students.schedules.createCta'),
          onClick: () => {
            setEditing(null);
            setFormOpen(true);
          },
        }}
      />
    );
  } else {
    body = (
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((tpl) => (
          <TemplateCard
            key={tpl.id}
            template={tpl}
            onEdit={(t) => {
              setEditing(t);
              setFormOpen(true);
            }}
            onDuplicate={(t) =>
              duplicate.mutate({
                ...t,
                amount: t.amount,
                perDepartmentAmounts: t.perDepartmentAmounts,
                appliesTo: t.appliesTo,
              })
            }
            onApply={(t) => setApplying(t)}
            onDelete={(t) => setDeleting(t)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <BackLink to="/students" pluralName={t('students.backPlural')} />
      <PageHeader
        title={t('students.schedules.title')}
        actions={
          <WriteButton
            type="button"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="mr-1 size-4" aria-hidden />
            {t('students.schedules.createCta')}
          </WriteButton>
        }
      />

      {body}

      <TemplateForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        template={editing}
      />

      <ApplyTemplateDialog
        open={!!applying}
        onOpenChange={(open) => {
          if (!open) setApplying(null);
        }}
        template={applying}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title={t('students.schedules.delete.title')}
        description={t('students.schedules.delete.body')}
        confirmLabel={t('students.schedules.card.delete')}
        destructive
        requireReason
        minReasonLength={20}
        onConfirm={async (reason) => {
          if (!deleting) return;
          try {
            await deleteTemplate.mutateAsync(reason ?? '');
            setDeleting(null);
          } catch {
            toast.error(t('students.schedule.errorToast'));
          }
        }}
      />
    </div>
  );
}
