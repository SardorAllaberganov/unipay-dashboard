import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DateDisplay } from '@/components/shared/DateDisplay';
import type { Department, Student } from '@/types/domain';

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
  return parts.join(' / ');
}

export function ProfileLeftColumn({ student, departments }: Props) {
  const { t } = useTranslation();
  const path = useMemo(() => departmentPath(student.departmentId, departments), [student.departmentId, departments]);
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('students.detail.personalCard')}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="divide-y divide-border text-sm">
            <Row label={t('students.detail.dob')} value={student.dob ? <DateDisplay value={student.dob} /> : '—'} />
            <Row
              label={t('students.detail.gender')}
              value={
                student.gender === 'male'
                  ? t('students.add.genderMale')
                  : student.gender === 'female'
                    ? t('students.add.genderFemale')
                    : '—'
              }
            />
            <Row label={t('students.detail.phone')} value={student.phone ?? '—'} />
            <Row label={t('students.detail.email')} value={student.email ?? '—'} />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('students.detail.academicCard')}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="divide-y divide-border text-sm">
            <Row label={t('students.detail.department')} value={path || '—'} />
            <Row label={t('students.detail.year')} value={student.year ?? '—'} />
            <Row
              label={t('students.detail.educationType')}
              value={t(`common.educationType.${student.educationType}`)}
            />
            <Row
              label={t('students.detail.enrollmentDate')}
              value={<DateDisplay value={student.enrollmentDate} />}
            />
            {student.endDate ? (
              <Row label={t('students.detail.endDate')} value={<DateDisplay value={student.endDate} />} />
            ) : null}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  // Mobile: label stacks ABOVE value (small uppercase tracking-wider §0.2-allow-listed
  // definition label, value below at body text-sm). Desktop (md+): switches to the
  // canonical label-left / value-right horizontal row. Stacking on mobile avoids the
  // cramped horizontal layout where long values (emails, full dept paths) wrapped
  // awkwardly inside ~150px of remaining row width.
  return (
    <div className="flex flex-col gap-1 py-2 first:pt-0 last:pb-0 md:flex-row md:items-baseline md:justify-between md:gap-3">
      <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground md:shrink-0 md:text-sm md:font-normal md:normal-case md:tracking-normal">
        {label}
      </dt>
      <dd className="break-words text-foreground md:min-w-0 md:text-right">{value}</dd>
    </div>
  );
}
