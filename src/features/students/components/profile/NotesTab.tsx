import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { WriteButton } from '@/components/unipay/WriteButton';
import { DateDisplay } from '@/components/shared/DateDisplay';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { OfflineState } from '@/components/system/OfflineState';
import { Skeleton } from '@/components/ui/skeleton';
import { useNetworkState } from '@/hooks/useNetworkState';
import { useAddStudentNote, useStudentNotes } from '../../hooks/useStudentNotes';
import { StudentAvatar } from '../shared/StudentAvatar';
import { MessageSquare } from 'lucide-react';

interface Props {
  studentId: string;
}

export function NotesTab({ studentId }: Props) {
  const { t } = useTranslation();
  const online = useNetworkState();
  const notesQuery = useStudentNotes(studentId);
  const addNote = useAddStudentNote(studentId);

  const [draft, setDraft] = useState('');
  const items = notesQuery.data?.items ?? [];

  const onSubmit = async () => {
    const body = draft.trim();
    if (body.length < 3) return;
    try {
      await addNote.mutateAsync({ body });
      setDraft('');
      toast.success(t('students.notes.savedToast'));
    } catch {
      toast.error(t('students.schedule.errorToast'));
    }
  };

  let content: React.ReactNode;
  if (notesQuery.isLoading) {
    content = (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  } else if (notesQuery.isError) {
    content = online ? (
      <ErrorState onRetry={() => void notesQuery.refetch()} />
    ) : (
      <OfflineState />
    );
  } else if (items.length === 0) {
    content = (
      <EmptyState
        icon={MessageSquare}
        title={t('students.notes.emptyTitle')}
        description={t('students.notes.emptyBody')}
      />
    );
  } else {
    content = (
      <ul className="space-y-3">
        {items.map((n) => {
          const [first = '', last = ''] = n.authorName.split(' ');
          return (
            <li key={n.id}>
              <Card>
                <CardContent className="flex gap-3 p-4">
                  <StudentAvatar firstName={first} lastName={last} size="sm" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <p className="text-sm font-medium text-foreground">{n.authorName}</p>
                      <DateDisplay value={n.createdAt} format="relative" className="text-muted-foreground" />
                    </div>
                    <p className="whitespace-pre-wrap text-base text-foreground">{n.body}</p>
                  </div>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-3 p-4">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t('students.notes.placeholder')}
            rows={3}
            maxLength={500}
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">{t('students.notes.auditNote')}</p>
            <WriteButton
              type="button"
              disabled={draft.trim().length < 3 || addNote.isPending}
              loading={addNote.isPending}
              onClick={() => void onSubmit()}
            >
              {addNote.isPending
                ? t('students.notes.submitting')
                : t('students.notes.submit')}
            </WriteButton>
          </div>
        </CardContent>
      </Card>
      {content}
    </div>
  );
}
