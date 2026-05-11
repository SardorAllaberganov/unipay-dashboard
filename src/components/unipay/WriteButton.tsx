// Drop-in for <Button> that disables when offline + Tooltip explains why (§0.11).
import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button, type ButtonProps } from '@/components/ui/button';
import { useNetworkState } from '@/hooks/useNetworkState';

export const WriteButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ disabled, children, ...props }, ref) => {
    const { t } = useTranslation();
    const online = useNetworkState();
    const isDisabled = disabled || !online;

    if (!online) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            {/* span wrapper so Tooltip works on a disabled button */}
            <span className="inline-flex">
              <Button ref={ref} disabled aria-disabled {...props}>
                {children}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>{t('common.offline.tooltip')}</TooltipContent>
        </Tooltip>
      );
    }

    return (
      <Button ref={ref} disabled={isDisabled} {...props}>
        {children}
      </Button>
    );
  }
);
WriteButton.displayName = 'WriteButton';
