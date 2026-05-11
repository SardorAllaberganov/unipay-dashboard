import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BackLink } from '@/components/shared/BackLink';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DateDisplay } from '@/components/shared/DateDisplay';
import type { Department, Student } from '@/types/domain';
import { StudentAvatar } from '../shared/StudentAvatar';

interface Props {
  student: Student;
  departments: Department[];
}

function departmentPath(departmentId: string, departments: Department[]): string {
  const byId = new Map(departments.map((d) => [d.id, d]));
  const parts: string[] = [];
  let current: Department | undefined = byId.get(departmentId);
  let safety = 0;
  while (current && safety++ < 8) {
    parts.unshift(current.name.ru);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return parts.slice(-2).join(' / ');
}

export function StudentDetailHeader({ student, departments }: Props) {
  const { t } = useTranslation();
  const location = useLocation();
  const backTo =
    (location.state as { from?: string } | null)?.from ?? '/students';

  return (
    <div className="space-y-4">
      <BackLink to={backTo} pluralName={t('students.detail.backPlural')} />

      <div className="flex flex-wrap items-start gap-4">
        <StudentAvatar
          firstName={student.firstName}
          lastName={student.lastName}
          avatarUrl={student.avatarUrl}
          size="lg"
        />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-page-title break-words text-foreground">
              {student.lastName} {student.firstName} {student.middleName ?? ''}
            </h1>
            <StatusBadge variant={student.paymentStatus} />
          </div>
          <p className="mono break-all text-sm text-muted-foreground">{student.studentId}</p>
          <p className="break-words text-sm text-muted-foreground">
            {departmentPath(student.departmentId, departments)}
            {student.year ? ` · ${student.year} ${t('students.detail.year').toLowerCase()}` : ''}
          </p>
        </div>
      </div>

      {/* Chips row - enrolled / end date / last activity */}
      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
        <Chip>
          <span>{t('students.detail.enrollmentDate')}:</span>
          <DateDisplay value={student.enrollmentDate} />
        </Chip>
        {student.endDate ? (
          <Chip>
            <span>{t('students.detail.endDate')}:</span>
            <DateDisplay value={student.endDate} />
          </Chip>
        ) : null}
        {student.updatedAt ? (
          <Chip>
            <span>{t('students.detail.lastActivity', { relative: '' }).trim()}</span>
            <DateDisplay value={student.updatedAt} format="relative" />
          </Chip>
        ) : null}
      </div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-muted/40 px-2 py-1 text-sm text-muted-foreground">
      {children}
    </span>
  );
}
