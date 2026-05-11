import { Link, Navigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UserX } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { BackLink } from '@/components/shared/BackLink';
import { DetailPageSkeleton } from '@/components/shared/DetailPageSkeleton';
import { ErrorState } from '@/components/shared/ErrorState';
import { EmptyState } from '@/components/shared/EmptyState';
import { OfflineState } from '@/components/system/OfflineState';
import { useNetworkState } from '@/hooks/useNetworkState';
import { useDepartments } from '@/features/organization/hooks/useDepartments';
import { useStudent } from '../hooks/useStudent';
import { StudentDetailHeader } from '../components/profile/StudentDetailHeader';
import { ProfileLeftColumn } from '../components/profile/ProfileLeftColumn';
import { ScheduleTab } from '../components/profile/ScheduleTab';
import { TransactionsTab } from '../components/profile/TransactionsTab';
import { NotesTab } from '../components/profile/NotesTab';
import { ActivityLogTab } from '../components/profile/ActivityLogTab';
import { StudentDetailActionBar } from '../components/profile/StudentDetailActionBar';

// Underline-style tab visual matching <OrgTabsNav> + Staff detail page. Centralized so all
// four triggers stay in sync.
const TAB_TRIGGER_CLASS =
  "relative inline-flex h-10 items-center rounded-none bg-transparent px-3 text-sm font-medium leading-none ring-offset-0 transition-colors hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-brand-700 data-[state=active]:shadow-none data-[state=active]:after:absolute data-[state=active]:after:inset-x-0 data-[state=active]:after:bottom-[-1px] data-[state=active]:after:h-[2px] data-[state=active]:after:bg-brand-600 data-[state=active]:after:content-[''] dark:data-[state=active]:text-brand-300";

const TAB_LIST_CLASS =
  '-mx-4 flex h-auto w-auto justify-start gap-1 overflow-x-auto whitespace-nowrap rounded-none border-b border-border bg-transparent p-0 px-4 text-muted-foreground md:mx-0 md:px-0';

export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const online = useNetworkState();
  const studentQuery = useStudent(id);
  const departmentsQuery = useDepartments();
  if (!id) return <Navigate to="/students" replace />;

  if (studentQuery.isPending) {
    return (
      <div className="pb-28">
        <DetailPageSkeleton tabs={4} />
      </div>
    );
  }

  const isNotFound =
    studentQuery.isError &&
    (studentQuery.error as Error | undefined)?.message?.includes(':404');

  if (isNotFound) {
    return (
      <div className="pb-28">
        <BackLink to="/students" pluralName={t('students.detail.backPlural')} className="mb-6" />
        <div className="flex flex-col items-center gap-3">
          <EmptyState
            icon={UserX}
            title={t('students.detail.notFoundTitle')}
            description={t('students.detail.notFoundBody')}
            className="max-w-2xl"
          />
          <Button asChild>
            <Link to="/students">{t('common.actions.back')}</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (studentQuery.isError || !studentQuery.data) {
    return (
      <div className="pb-28">
        <BackLink to="/students" pluralName={t('students.detail.backPlural')} className="mb-6" />
        {online ? <ErrorState onRetry={() => void studentQuery.refetch()} /> : <OfflineState />}
      </div>
    );
  }

  const student = studentQuery.data;
  const departments = departmentsQuery.data?.items ?? [];

  return (
    <div className="min-w-0 pb-28">
      <StudentDetailHeader student={student} departments={departments} />

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <aside className="min-w-0 lg:col-span-2">
          <ProfileLeftColumn student={student} departments={departments} />
        </aside>
        <section className="min-w-0 lg:col-span-3">
          <Tabs defaultValue="schedule" className="w-full">
            <TabsList className={TAB_LIST_CLASS}>
              <TabsTrigger value="schedule" className={TAB_TRIGGER_CLASS}>
                {t('students.detail.tabs.schedule')}
              </TabsTrigger>
              <TabsTrigger value="transactions" className={TAB_TRIGGER_CLASS}>
                {t('students.detail.tabs.transactions')}
              </TabsTrigger>
              <TabsTrigger value="notes" className={TAB_TRIGGER_CLASS}>
                {t('students.detail.tabs.notes')}
              </TabsTrigger>
              <TabsTrigger value="activity" className={TAB_TRIGGER_CLASS}>
                {t('students.detail.tabs.activity')}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="schedule" className="mt-4">
              <ScheduleTab studentId={student.id} />
            </TabsContent>
            <TabsContent value="transactions" className="mt-4">
              <TransactionsTab studentId={student.id} />
            </TabsContent>
            <TabsContent value="notes" className="mt-4">
              <NotesTab studentId={student.id} />
            </TabsContent>
            <TabsContent value="activity" className="mt-4">
              <ActivityLogTab studentId={student.id} />
            </TabsContent>
          </Tabs>
        </section>
      </div>

      <StudentDetailActionBar student={student} />
    </div>
  );
}
