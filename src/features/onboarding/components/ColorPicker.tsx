import { forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Props {
  value: string;
  onChange: (hex: string) => void;
  className?: string;
}

export const ColorPicker = forwardRef<HTMLInputElement, Props>(
  ({ value, onChange, className }, ref) => {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <input
          ref={ref}
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : '#1558B0'}
          onChange={(e) => onChange(e.target.value)}
          className="size-9 cursor-pointer rounded-lg border border-input bg-background"
          aria-label="Color picker"
        />
        <Input
          type="text"
          value={value}
          onChange={(e) => {
            const v = e.target.value.startsWith('#') ? e.target.value : '#' + e.target.value;
            onChange(v.toUpperCase().slice(0, 7));
          }}
          className="font-mono uppercase"
          maxLength={7}
          placeholder="#1558B0"
        />
      </div>
    );
  }
);
ColorPicker.displayName = 'ColorPicker';
