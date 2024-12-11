import { Button, buttonVariants } from "@/components/ui/button";
import {
  DialogClose,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useShake } from "@/hooks";
import { cn } from "@/utils";
import { CollectionSchema } from "@fiberplane/fpx-types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";

export type CollectionFormData = {
  name: string;
};

type Props = {
  initialData?: Partial<CollectionFormData>;
  onSubmit: SubmitHandler<CollectionFormData>;
  isPending?: boolean;
  error: Error | null;
  /**
   * Whether the form is rendered inside a dialog.
   */
  inDialog?: boolean;
};

const CreateCollectionSchema = CollectionSchema.pick({ name: true });

export function CollectionForm(props: Props) {
  const { onSubmit, isPending, error, initialData, inDialog = false } = props;
  const { register, handleSubmit, formState } = useForm<CollectionFormData>({
    resolver: zodResolver(CreateCollectionSchema),
    defaultValues: initialData || {},
  });
  const { errors, isValidating, isValid, isSubmitting } = formState;
  const { shakeClassName, triggerShake } = useShake();
  const shouldShake = !isValid && isSubmitting && !isValidating;

  useEffect(() => {
    if (!shouldShake) {
      return;
    }

    triggerShake();
  }, [shouldShake, triggerShake]);

  const Title = inDialog ? DialogTitle : "h4";
  const Description = inDialog ? DialogDescription : "p";

  return (
    <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-2 grid gap-2">
        <Title className="text-md text-center">
          {initialData ? "Edit" : "New"} collection
        </Title>
        <Description className="text-sm text-muted-foreground">
          {initialData
            ? "Change the name of the collection"
            : "Create a new collection"}
        </Description>
        {error && (
          <p className="text-sm text-destructive-foreground">{error.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground" htmlFor="name">
          Name
        </Label>
        <Input
          {...register("name")}
          id="name"
          type="text"
          className={cn("col-span-2 h-8 font-mono", {
            "border-destructive": errors.name,
          })}
          autoFocus
          autoComplete="off"
          data-1p-ignore
          data-lpignore="true"
        />
        {errors.name && (
          <p className="text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>
      <div className="flex justify-end gap-4">
        {inDialog && (
          <DialogClose
            className={cn(
              buttonVariants({
                variant: "secondary",
                size: "sm",
              }),
              "h-7",
            )}
          >
            Cancel
          </DialogClose>
        )}
        <Button
          size="sm"
          disabled={isPending}
          className={cn("h-7", shakeClassName)}
        >
          {initialData ? "Save" : "Create"}
        </Button>
      </div>
    </form>
  );
}
