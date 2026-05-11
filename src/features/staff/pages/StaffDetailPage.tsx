import { useState } from 'react';
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
import { useSession } from '@/lib/auth';
import { useStaffById } from '../hooks/useStaffById';
import { StaffDetailHeader } from '../components/detail/StaffDetailHeader';
import { ProfileTab } from '../components/detail/ProfileTab';
import { RoleAndPermissionsTab } from '../components/detail/RoleAndPermissionsTab';
import { ActivityLogTab } from '../components/detail/ActivityLogTab';
import { SessionsTab } from '../components/detail/SessionsTab';
import { EditRoleDialog } from '../components/dialogs/EditRoleDialog';
import { EditAccessDialog } from '../components/dialogs/EditAccessDialog';

// Underline-style tab visual matching <OrgTabsNav>. Overrides shadcn Tabs' segmented-pill
// defaults: transparent bg, 2px brand-600 underline on active, brand-700 text on active.
// Centralized here so all four triggers stay in sync.
const TAB_TRIGGER_CLASS =
  "relative inline-flex h-10 items-center rounded-none bg-transparent px-3 text-sm font-medium leading-none ring-offset-0 transition-colors hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-brand-700 data-[state=active]:shadow-none data-[state=active]:after:absolute data-[state=active]:after:inset-x-0 data-[state=active]:after:bottom-[-1px] data-[state=active]:after:h-[2px] data-[state=active]:after:bg-brand-600 data-[state=active]:after:content-[''] dark:data-[state=active]:text-brand-300";

const TAB_LIST_CLASS =
  '-mx-4 flex h-auto w-auto justify-start gap-1 overflow-x-auto whitespace-nowrap rounded-none border-b border-border bg-transparent p-0 px-4 text-muted-foreground md:mx-0 md:px-0';

export default function StaffDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const online = useNetworkState();
  const session = useSession();
  const { data, isPending, isError, error, refetch } = useStaffById(id);
  const [editRoleOpen, setEditRoleOpen] = useState(false);
  const [editAccessOpen, setEditAccessOpen] = useState(false);

  if (!id) return <Navigate to="/staff" replace />;

  if (isPending) {
    return (
      <div className="pb-12">
        <DetailPageSkeleton tabs={4} />
      </div>
    );
  }

  const isNotFound =
    isError && (error as Error | undefined)?.message?.includes(':404');

  if (isNotFound) {
    return (
      <div className="pb-12">
        <BackLink
          to="/staff"
          pluralName={t('staff.backPlural')}
          className="mb-6"
        />
        <div className="flex flex-col items-center gap-3">
          <EmptyState
            icon={UserX}
            title={t('staff.detail.notFoundTitle')}
            description={t('staff.detail.notFoundBody')}
            className="max-w-2xl"
          />
          <Button asChild>
            <Link to="/staff">{t('staff.detail.backToList')}</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="pb-12">
        <BackLink
          to="/staff"
          pluralName={t('staff.backPlural')}
          className="mb-6"
        />
        {online ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : (
          <OfflineState />
        )}
      </div>
    );
  }

  const currentUserId = session?.profile.id;
  const currentRole = session?.profile.role;
  // Sessions tab visibility per spec: viewing own profile OR current user is Owner.
  const showSessionsTab =
    !!currentUserId &&
    (currentUserId === data.id || currentRole === 'owner');

  return (
    <div className="pb-12">
      <StaffDetailHeader
        staff={data}
        onOpenEditRole={() => setEditRoleOpen(true)}
        onOpenEditAccess={() => setEditAccessOpen(true)}
      />

      {/* Full-width tabs — identity/metadata previously living in a left card are now
         merged into the Profile tab so the tab strip and its content both span fully. */}
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className={TAB_LIST_CLASS}>
          <TabsTrigger value="profile" className={TAB_TRIGGER_CLASS}>
            {t('staff.detail.tabs.profile')}
          </TabsTrigger>
          <TabsTrigger value="role" className={TAB_TRIGGER_CLASS}>
            {t('staff.role.title')}
          </TabsTrigger>
          <TabsTrigger value="activity" className={TAB_TRIGGER_CLASS}>
            {t('staff.detail.tabs.activity')}
          </TabsTrigger>
          {showSessionsTab ? (
            <TabsTrigger value="sessions" className={TAB_TRIGGER_CLASS}>
              {t('staff.tabsExtended.sessions')}
            </TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value="profile" className="pt-4">
          <ProfileTab staff={data} />
        </TabsContent>
        <TabsContent value="role" className="pt-4">
          <RoleAndPermissionsTab staff={data} />
        </TabsContent>
        <TabsContent value="activity" className="pt-4">
          <ActivityLogTab staffId={data.id} />
        </TabsContent>
        {showSessionsTab ? (
          <TabsContent value="sessions" className="pt-4">
            <SessionsTab staffId={data.id} />
          </TabsContent>
        ) : null}
      </Tabs>

      <EditRoleDialog
        open={editRoleOpen}
        onOpenChange={setEditRoleOpen}
        staff={data}
      />
      <EditAccessDialog
        open={editAccessOpen}
        onOpenChange={setEditAccessOpen}
        staff={data}
      />
    </div>
  );
}
