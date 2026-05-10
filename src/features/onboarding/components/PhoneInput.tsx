import { forwardRef } from 'react';
import { Input, type InputProps } from '@/components/ui/input';

interface Props extends Omit<InputProps, 'value' | 'onChange' | 'type'> {
  value?: string;
  onChange?: (digits: string) => void;
}

function formatPhone(digits: string): string {
  if (!digits) return '';
  const trimmed = digits.replace(/\D/g, '').slice(0, 12);
  const rest = trimmed.startsWith('998') ? trimmed.slice(3) : trimmed;
  let out = '+998';
  if (rest.length > 0) out += ' (' + rest.slice(0, 2);
  if (rest.length >= 2) out += ')';
  if (rest.length > 2) out += ' ' + rest.slice(2, 5);
  if (rest.length > 5) out += '-' + rest.slice(5, 7);
  if (rest.length > 7) out += '-' + rest.slice(7, 9);
  return out;
}

export const PhoneInput = forwardRef<HTMLInputElement, Props>(
  ({ value = '', onChange, ...props }, ref) => {
    const display = formatPhone(value);
    return (
      <Input
        ref={ref}
        type="tel"
        autoComplete="tel"
        inputMode="numeric"
        placeholder="+998 (XX) XXX-XX-XX"
        value={display}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, '').slice(0, 12);
          const normalized = digits.startsWith('998')
            ? digits
            : digits.length > 0
              ? '998' + digits.slice(0, 9)
              : '';
          onChange?.(normalized.slice(0, 12));
        }}
        {...props}
      />
    );
  }
);
PhoneInput.displayName = 'PhoneInput';
