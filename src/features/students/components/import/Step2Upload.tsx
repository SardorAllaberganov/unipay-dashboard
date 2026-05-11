import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Upload } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WriteButton } from '@/components/unipay/WriteButton';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface Props {
  onParse: (file: File) => Promise<void>;
  onBack: () => void;
  parsing: boolean;
  errorCode?: string;
}

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_EXTS = new Set(['.xlsx', '.csv']);

export function Step2Upload({ onParse, onBack, parsing, errorCode }: Props) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [draggedOver, setDraggedOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  function validate(file: File): string | null {
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED_EXTS.has(ext)) return t('students.import.step2.wrongFormat');
    if (file.size > MAX_BYTES) return t('students.import.step2.fileTooLarge');
    return null;
  }

  async function handleFile(file: File) {
    const err = validate(file);
    if (err) {
      setLocalError(err);
      return;
    }
    setLocalError(null);
    try {
      await onParse(file);
    } catch (e) {
      setLocalError((e as Error).message ?? t('students.import.step2.parseError'));
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <h2 className="text-lg font-semibold">{t('students.import.step2.title')}</h2>
        <p className="text-sm text-muted-foreground">{t('students.import.step2.body')}</p>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDraggedOver(true);
          }}
          onDragLeave={() => setDraggedOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDraggedOver(false);
            const file = e.dataTransfer.files[0];
            if (file) void handleFile(file);
          }}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed border-border p-10 text-center transition-colors hover:border-brand-600/40 hover:bg-brand-50/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2',
            draggedOver && 'border-brand-600 bg-brand-50',
          )}
          aria-label={t('students.import.step2.drop')}
        >
          <Upload className="size-10 text-muted-foreground" aria-hidden />
          <p className="text-sm font-medium text-foreground">{t('students.import.step2.drop')}</p>
          <Button type="button" variant="outline" size="sm" disabled={parsing}>
            {t('students.import.step2.choose')}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
              e.target.value = '';
            }}
          />
        </div>

        {parsing ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              {t('students.import.step2.parsing')}
            </div>
            <Progress value={70} />
          </div>
        ) : null}

        {(localError || errorCode) && !parsing ? (
          <p className="text-sm text-danger-700" role="alert">
            {localError ?? t('students.import.step2.parseError')}
          </p>
        ) : null}

        <div className="flex flex-wrap justify-between gap-2">
          <Button type="button" variant="ghost" onClick={onBack} disabled={parsing}>
            {t('students.import.step2.cancel')}
          </Button>
          <WriteButton type="button" disabled className="hidden md:inline-flex">
            {t('students.import.step2.next')}
          </WriteButton>
        </div>
      </CardContent>
    </Card>
  );
}
