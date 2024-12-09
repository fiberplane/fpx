import { Button } from "@/components/ui/button";
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
};

const CreateCollectionSchema = CollectionSchema.pick({ name: true });

export function CollectionForm(props: Props) {
  const { onSubmit, isPending, error, initialData } = props;
  const { register, handleSubmit } = useForm<CollectionFormData>({
    resolver: zodResolver(CreateCollectionSchema),
    defaultValues: initialData || {},
  });
  const { shakeClassName, triggerShake } = useShake();
  useEffect(() => {
    if (isPending) {
      return;
    }

    if (error) {
      triggerShake();
    }
  }, [error, triggerShake, isPending]);

  return (
    <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <h4 className="text-md text-muted-foreground text-center">
          {initialData ? "Edit" : "New"} collection
        </h4>
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
          className="col-span-2 h-8 font-mono"
          autoFocus
          autoComplete="off"
          data-1p-ignore
          data-lpignore="true"
        />
      </div>
      <div className="flex justify-end">
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
