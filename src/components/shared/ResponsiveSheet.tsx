import type { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-breakpoint';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  contentClassName?: string;
}

export function ResponsiveSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  contentClassName,
}: Props) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className={contentClassName}>
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            {description ? <SheetDescription>{description}</SheetDescription> : null}
          </SheetHeader>
          <div className="mt-4">{children}</div>
          {footer ? <div className="mt-4">{footer}</div> : null}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={contentClassName}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <div>{children}</div>
        {footer ? <div className="flex justify-end gap-2">{footer}</div> : null}
      </DialogContent>
    </Dialog>
  );
}
