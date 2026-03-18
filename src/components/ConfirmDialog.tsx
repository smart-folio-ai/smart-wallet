import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  trigger?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmIcon?: ReactNode;
  confirmVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  onConfirm: () => void;
  loading?: boolean;
  disabled?: boolean;
  preventCloseWhileLoading?: boolean;
};

export const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  trigger,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  confirmIcon,
  confirmVariant = 'destructive',
  onConfirm,
  loading = false,
  disabled = false,
  preventCloseWhileLoading = true,
}: ConfirmDialogProps) => {
  const handleOpenChange = (next: boolean) => {
    if (preventCloseWhileLoading && loading) return;
    onOpenChange(next);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      {trigger ? <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger> : null}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline" disabled={disabled || loading}>
              {cancelLabel}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant={confirmVariant}
              disabled={disabled || loading}
              onClick={onConfirm}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                confirmIcon
              )}
              {confirmLabel}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

