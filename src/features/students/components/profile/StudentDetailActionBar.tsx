import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MessageSquare, Pencil, Trash2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WriteButton } from '@/components/unipay/WriteButton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useSession } from '@/lib/auth';
import type { Student } from '@/types/domain';
import {
  useDeleteStudent,
  useSendStudentSms,
  useUpdateStudent,
} from '../../hooks/useStudentMutations';

interface Props {
  student: Student;
}

export function StudentDetailActionBar({ student }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const session = useSession();
  const isOwner = session?.profile.role === 'owner';

  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [smsOpen, setSmsOpen] = useState(false);

  const update = useUpdateStudent(student.id);
  const remove = useDeleteStudent(student.id);
  const sendSms = useSendStudentSms(student.id);

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card px-4 py-3 md:left-[var(--sidebar-width,4rem)] md:px-6">
        {/* Two intent groups: maintenance (Edit / SMS) on the LEFT, destructive
           (Deactivate / Delete) on the RIGHT. Mobile: each group on its own row with
           buttons sharing 50/50. Desktop (md+): both groups inline with space-between. */}
        <div className="flex w-full flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex w-full gap-2 md:w-auto md:flex-none">
            <Button
              type="button"
              variant="outline"
              className="flex-1 md:flex-none"
              onClick={() => navigate(`/students/${student.id}/edit`)}
            >
              <Pencil className="mr-1.5 size-4" aria-hidden />
              {t('students.detail.edit')}
            </Button>
            <WriteButton
              type="button"
              variant="outline"
              className="flex-1 md:flex-none"
              onClick={() => setSmsOpen(true)}
            >
              <MessageSquare className="mr-1.5 size-4" aria-hidden />
              {t('students.detail.sendSms')}
            </WriteButton>
          </div>
          <div className="flex w-full gap-2 md:w-auto md:flex-none">
            {student.status === 'active' ? (
              <WriteButton
                type="button"
                variant="destructive"
                className="flex-1 md:flex-none"
                onClick={() => setDeactivateOpen(true)}
              >
                <XCircle className="mr-1.5 size-4" aria-hidden />
                {t('students.detail.deactivate')}
              </WriteButton>
            ) : null}
            {isOwner ? (
              <WriteButton
                type="button"
                variant="destructive"
                className="flex-1 md:flex-none"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="mr-1.5 size-4" aria-hidden />
                {t('students.detail.delete')}
              </WriteButton>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex-1 md:flex-none">
                    <Button
                      type="button"
                      variant="destructive"
                      disabled
                      className="w-full md:w-auto"
                    >
                      <Trash2 className="mr-1.5 size-4" aria-hidden />
                      {t('students.detail.delete')}
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>{t('students.detail.deleteOwnerOnly')}</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deactivateOpen}
        onOpenChange={setDeactivateOpen}
        title={t('students.detail.deactivateTitle')}
        description={t('students.detail.deactivateBody')}
        confirmLabel={t('students.bulk.deactivateConfirm')}
        destructive
        requireReason
        minReasonLength={20}
        onConfirm={async () => {
          await update.mutateAsync({ status: 'inactive' });
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t('students.detail.deleteTitle')}
        description={t('students.detail.deleteBody')}
        confirmLabel={t('students.detail.delete')}
        destructive
        requireReason
        minReasonLength={20}
        onConfirm={async (reason) => {
          await remove.mutateAsync(reason ?? '');
          navigate('/students');
        }}
      />

      <SmsDialog
        open={smsOpen}
        onOpenChange={setSmsOpen}
        onSend={async (message) => {
          await sendSms.mutateAsync(message);
        }}
      />
    </>
  );
}

// ---- SMS dialog ----
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

function SmsDialog({
  open,
  onOpenChange,
  onSend,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (message: string) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('students.detail.smsTitle')}</DialogTitle>
          <DialogDescription>{t('students.notes.placeholder')}</DialogDescription>
        </DialogHeader>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          maxLength={300}
        />
        <DialogFooter>
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
            {t('common.actions.cancel')}
          </Button>
          <WriteButton
            type="button"
            disabled={message.trim().length === 0 || sending}
            loading={sending}
            onClick={async () => {
              setSending(true);
              try {
                await onSend(message.trim());
                onOpenChange(false);
                setMessage('');
              } finally {
                setSending(false);
              }
            }}
          >
            {t('students.detail.sendSms')}
          </WriteButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
