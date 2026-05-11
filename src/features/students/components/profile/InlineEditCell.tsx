import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Props {
  value: string;
  /** Optional renderer for display mode (e.g. money formatting, date formatting). */
  display?: (raw: string) => React.ReactNode;
  onSave: (next: string) => Promise<void> | void;
  /** Native input type - `text` (default), `number`, or `date`. */
  type?: 'text' | 'number' | 'date';
  inputMode?: 'numeric' | 'decimal' | 'text';
  ariaLabel: string;
  /** Disable editing (e.g. read-only row). */
  disabled?: boolean;
  className?: string;
  /** Optional right-align (for amount cells). */
  align?: 'left' | 'right';
}

/**
 * Click-to-edit table cell. Per STYLE_DISCIPLINE §0.2 the input minimum size is the
 * small body scale (13px) in every density, never the chip-size 12px scale. Enter
 * saves; Esc / blur cancels. Tap target is the full cell content (>= 44px via parent
 * row height + cell padding).
 */
export function InlineEditCell({
  value,
  display,
  onSave,
  type = 'text',
  inputMode,
  ariaLabel,
  disabled,
  className,
  align = 'left',
}: Props) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [editing, value]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const startEditing = () => {
    if (disabled || saving) return;
    setDraft(value);
    setEditing(true);
  };

  const commit = async () => {
    if (draft === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
    } catch {
      // Keep the cell open so the user sees their pending change; surface error via toast.
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void commit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancel();
    }
  };

  if (editing) {
    return (
      <Input
        ref={inputRef}
        type={type}
        inputMode={inputMode}
        value={draft}
        disabled={saving}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKey}
        onBlur={() => void commit()}
        aria-label={ariaLabel}
        className={cn(
          'h-9 text-sm',
          align === 'right' && 'text-right tabular',
          className,
        )}
      />
    );
  }

  return (
    <button
      type="button"
      disabled={disabled || saving}
      onClick={startEditing}
      aria-label={t('students.schedule.editAria', { label: ariaLabel })}
      className={cn(
        'group/edit inline-flex h-9 min-h-9 w-full items-center gap-1.5 rounded-md px-2 text-sm hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60',
        align === 'right' && 'justify-end tabular',
        align === 'left' && 'justify-start',
        className,
      )}
    >
      <span className="truncate">{display ? display(value) : value}</span>
      <Pencil
        className={cn(
          'size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/edit:opacity-100 group-focus-visible/edit:opacity-100',
        )}
        aria-hidden
      />
    </button>
  );
}
