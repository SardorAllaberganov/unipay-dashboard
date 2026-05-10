import { useRef, useState, useCallback } from 'react';
import { Upload, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  value: string;
  onChange: (dataUrl: string) => void;
}

const MAX_SIZE = 1024 * 1024;
const ACCEPT = ['image/png', 'image/svg+xml', 'image/jpeg'];

export function LogoUploader({ value, onChange }: Props) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (!ACCEPT.includes(file.type)) {
        setError(t('onboarding.errors.logoType'));
        return;
      }
      if (file.size > MAX_SIZE) {
        setError(t('onboarding.errors.logoSize'));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onChange(reader.result);
          setError(null);
        }
      };
      reader.readAsDataURL(file);
    },
    [onChange, t]
  );

  return (
    <div className="space-y-2">
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border p-6 transition-colors',
          dragOver && 'border-brand-600 bg-brand-50'
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
      >
        {value ? (
          <>
            <img src={value} alt="Logo preview" className="size-32 rounded-lg object-contain" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onChange('');
                setError(null);
              }}
            >
              <Trash2 className="size-4" aria-hidden />
              {t('onboarding.logoRemove')}
            </Button>
          </>
        ) : (
          <>
            <Upload className="size-8 text-muted-foreground" aria-hidden />
            <div className="text-center text-sm text-muted-foreground">
              {t('onboarding.logoDropHint')}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
            >
              {t('onboarding.logoChoose')}
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT.join(',')}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = '';
              }}
            />
          </>
        )}
      </div>
      {error ? <p className="text-sm text-danger-600">{error}</p> : null}
    </div>
  );
}
