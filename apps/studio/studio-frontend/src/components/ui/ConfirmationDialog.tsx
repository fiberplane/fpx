import { cn } from "@/utils";
import * as Dialog from "@radix-ui/react-dialog";
import type { VariantProps } from "class-variance-authority";
import { type ReactNode, useRef } from "react";
import { Button, type buttonVariants } from "./button";
import { DialogContent, DialogTitle } from "./dialog";

type ConfirmationDialogProps = {
  title: ReactNode;
  className?: string;
  description: ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmButtonVariant?: VariantProps<typeof buttonVariants>["variant"];
};

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  title,
  description,
  className,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  confirmButtonVariant = "destructive",
}) => {
  const ref = useRef<HTMLButtonElement>(null);

  return (
    <DialogContent
      className={cn("max-w-screen-sm", className)}
      onOpenAutoFocus={(event) => {
        event.preventDefault();
        // Focus the confirm button when the dialog opens
        ref.current?.focus();
      }}
    >
      <DialogTitle>{title}</DialogTitle>
      <Dialog.Description className="mt-2 text-sm text-gray-600">
        {description}
      </Dialog.Description>
      <div className="mt-4 flex justify-end space-x-2">
        <Button variant="secondary" onClick={onCancel}>
          {cancelText}
        </Button>
        <Button variant={confirmButtonVariant} onClick={onConfirm} ref={ref}>
          {confirmText}
        </Button>
      </div>
    </DialogContent>
  );
};
