import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Props {
  onNext: () => void;
}

export function Step1Download({ onNext }: Props) {
  const { t } = useTranslation();
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // Dynamic-import `xlsx` so it doesn't ship in the main bundle (matches canvas-confetti pattern).
      const xlsx = await import('xlsx');
      const wb = xlsx.utils.book_new();

      // "Students" sheet - header row + 1 example row.
      const studentsSheet = xlsx.utils.aoa_to_sheet([
        [
          'studentId', 'firstName', 'lastName', 'middleName', 'dob',
          'phone', 'email', 'departmentId', 'year', 'educationType',
          'enrollmentDate', 'amount', 'dueDate',
        ],
        [
          'ENG-1A-001', 'Алишер', 'Каримов', '', '2006-05-12',
          '+998 90 123-45-67', 'alisher.karimov@stud.uz',
          'fac-eng-dep1-y1-A', '1', 'full-time',
          '2026-09-01', '5000000', '2026-09-15',
        ],
      ]);
      // Widen columns for readability.
      studentsSheet['!cols'] = [
        { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 12 },
        { wch: 16 }, { wch: 22 }, { wch: 22 }, { wch: 6 }, { wch: 12 },
        { wch: 14 }, { wch: 12 }, { wch: 12 },
      ];
      xlsx.utils.book_append_sheet(wb, studentsSheet, 'Students');

      // "Instructions" sheet - guidance for each column.
      const instructions = xlsx.utils.aoa_to_sheet([
        ['Field', 'Description', 'Example'],
        ['studentId', 'Уникальный ID студента (обязательно)', 'ENG-1A-001'],
        ['firstName', 'Имя (обязательно)', 'Алишер'],
        ['lastName', 'Фамилия (обязательно)', 'Каримов'],
        ['middleName', 'Отчество', ''],
        ['dob', 'Дата рождения, YYYY-MM-DD', '2006-05-12'],
        ['phone', '+998 90 XXX-XX-XX', '+998 90 123-45-67'],
        ['email', 'Email', 'alisher@stud.uz'],
        ['departmentId', 'ID группы (см. вкладку Departments)', 'fac-eng-dep1-y1-A'],
        ['year', 'Курс (1-6)', '1'],
        ['educationType', 'full-time | part-time | evening | remote', 'full-time'],
        ['enrollmentDate', 'Дата зачисления, YYYY-MM-DD', '2026-09-01'],
        ['amount', 'Сумма периода в UZS', '5000000'],
        ['dueDate', 'Срок оплаты, YYYY-MM-DD', '2026-09-15'],
      ]);
      instructions['!cols'] = [{ wch: 16 }, { wch: 60 }, { wch: 24 }];
      xlsx.utils.book_append_sheet(wb, instructions, 'Instructions');

      // Trigger download via Blob (browser-friendly path that works on Pages too).
      const out = xlsx.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
      const blob = new Blob([out], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'unipay-students-template.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <h2 className="text-lg font-semibold">{t('students.import.step1.title')}</h2>
        <p className="text-sm text-muted-foreground">{t('students.import.step1.body')}</p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => void handleDownload()} disabled={downloading}>
            <Download className="mr-1.5 size-4" aria-hidden />
            {t('students.import.step1.download')}
          </Button>
          <Button type="button" variant="outline" onClick={onNext}>
            {t('students.import.step1.next')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
