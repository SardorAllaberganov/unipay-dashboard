import { useRef, useState, useCallback } from 'react';
import { Upload, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Labels {
  dropHint: string;
  choose: string;
  remove: string;
  errorType: string;
  errorSize: string;
  errorDimensions?: string;
}

interface Props {
  value: string;
  onChange: (dataUrl: string) => void;
  labels: Labels;
  maxSizeBytes?: number;
  minDimensions?: { width: number; height: number };
  accept?: readonly string[];
}

const DEFAULT_ACCEPT = ['image/png', 'image/svg+xml', 'image/jpeg'] as const;
const ONE_MB = 1024 * 1024;

export function LogoUploader({
  value,
  onChange,
  labels,
  maxSizeBytes = ONE_MB,
  minDimensions,
  accept = DEFAULT_ACCEPT,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (!accept.includes(file.type)) {
        setError(labels.errorType);
        return;
      }
      if (file.size > maxSizeBytes) {
        setError(labels.errorSize);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result !== 'string') return;
        const dataUrl = reader.result;
        if (minDimensions && file.type !== 'image/svg+xml') {
          const probe = new Image();
          probe.onload = () => {
            if (
              probe.naturalWidth < minDimensions.width ||
              probe.naturalHeight < minDimensions.height
            ) {
              setError(labels.errorDimensions ?? labels.errorSize);
              return;
            }
            onChange(dataUrl);
            setError(null);
          };
          probe.onerror = () => setError(labels.errorType);
          probe.src = dataUrl;
        } else {
          onChange(dataUrl);
          setError(null);
        }
      };
      reader.readAsDataURL(file);
    },
    [accept, labels, maxSizeBytes, minDimensions, onChange]
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
            <img src={value} alt="" className="size-32 rounded-lg object-contain" />
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
              {labels.remove}
            </Button>
          </>
        ) : (
          <>
            <Upload className="size-8 text-muted-foreground" aria-hidden />
            <div className="text-center text-sm text-muted-foreground">{labels.dropHint}</div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
            >
              {labels.choose}
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept={accept.join(',')}
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
