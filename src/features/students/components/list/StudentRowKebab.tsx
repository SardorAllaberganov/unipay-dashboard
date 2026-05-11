import { useState } from 'react';
import { MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useUpdateStudent } from '../../hooks/useStudentMutations';
import { useSendStudentSms } from '../../hooks/useStudentMutations';
import type { Student } from '@/types/domain';

interface Props {
  student: Student;
  onChangeDept: (student: Student) => void;
}

export function StudentRowKebab({ student, onChangeDept }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  const update = useUpdateStudent(student.id);
  const sendSms = useSendStudentSms(student.id);

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="size-9 p-0"
            aria-label={t('students.list.rowKebab.openMenu')}
          >
            <MoreVertical className="size-4" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onSelect={() => navigate(`/students/${student.id}`)}>
            {t('students.list.rowKebab.open')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => sendSms.mutate(t('students.detail.smsTitle'))}
          >
            {t('students.list.rowKebab.sendSms')}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onChangeDept(student)}>
            {t('students.list.rowKebab.changeDept')}
          </DropdownMenuItem>
          {student.status === 'active' ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setConfirmDeactivate(true)}
                className="text-danger-700 focus:text-danger-700"
              >
                {t('students.list.rowKebab.deactivate')}
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmDeactivate}
        onOpenChange={setConfirmDeactivate}
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
    </>
  );
}
