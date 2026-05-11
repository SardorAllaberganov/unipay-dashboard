import { useTranslation } from 'react-i18next';
import { Checkbox } from '@/components/ui/checkbox';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { AmountDisplay } from '@/components/shared/AmountDisplay';
import { DateDisplay } from '@/components/shared/DateDisplay';
import type { Student } from '@/types/domain';
import { StudentAvatar } from '../shared/StudentAvatar';
import { StudentRowKebab } from './StudentRowKebab';

interface Props {
  student: Student;
  departmentLabel: string;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onChangeDept: (student: Student) => void;
}

/**
 * Mobile card render for the Students list. Built for glanceability:
 * - Row 1: checkbox + avatar + name (with student ID below) + kebab pinned right.
 * - Row 2: status badge LEFT, current balance RIGHT — the two data points an operator
 *          scans for when deciding which student to act on. The amount is the largest
 *          piece of content on the card so it lands first to the eye.
 * - Row 3: muted subtitle "Department / N курс". Truncates with the dept path, never
 *          wraps to a second line (would push the card too tall).
 * - Row 4: last payment date (or "no payments" placeholder), tabular for vertical
 *          rhythm. Kept because finance reviewers triage by recency.
 */
export function StudentMobileCard({
  student,
  departmentLabel,
  selected,
  onToggleSelect,
  onChangeDept,
}: Props) {
  const { t } = useTranslation();
  const yearLabel = student.year
    ? `${student.year} ${t('students.list.columns.year').toLowerCase()}`
    : '';
  const subtitle = [departmentLabel, yearLabel].filter(Boolean).join(' · ');

  return (
    <div className="flex flex-col gap-3">
      {/* Row 1 — identity */}
      <div className="flex items-start gap-3">
        <div onClick={(e) => e.stopPropagation()} className="pt-1">
          <Checkbox
            checked={selected}
            onCheckedChange={() => onToggleSelect(student.id)}
            aria-label={`${student.lastName} ${student.firstName}`}
          />
        </div>
        <StudentAvatar
          firstName={student.firstName}
          lastName={student.lastName}
          avatarUrl={student.avatarUrl}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {student.lastName} {student.firstName}
          </p>
          <p className="mono truncate text-xs text-muted-foreground">{student.studentId}</p>
        </div>
        <div onClick={(e) => e.stopPropagation()} className="-mr-1 shrink-0">
          <StudentRowKebab student={student} onChangeDept={onChangeDept} />
        </div>
      </div>

      {/* Row 2 — primary data line: status (left) + balance (right) */}
      <div className="flex items-center justify-between gap-3">
        <StatusBadge variant={student.paymentStatus} />
        <AmountDisplay
          value={student.currentBalance}
          className="text-base font-semibold text-foreground"
        />
      </div>

      {/* Row 3 — context subtitle */}
      {subtitle ? (
        <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
      ) : null}

      {/* Row 4 — last payment recency */}
      <p className="text-sm text-muted-foreground">
        {t('students.list.columns.lastPayment')}:{' '}
        {student.lastPaymentAt ? (
          <DateDisplay value={student.lastPaymentAt} className="text-foreground" />
        ) : (
          <span>{t('students.list.lastPaymentNever')}</span>
        )}
      </p>
    </div>
  );
}
