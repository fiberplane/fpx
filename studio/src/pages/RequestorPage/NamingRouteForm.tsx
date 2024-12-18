import { type SubmitHandler, useForm } from "react-hook-form";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useShake } from "@/hooks";
import { cn } from "@/utils";
import { CollectionItemParamsSchema } from "@fiberplane/fpx-types";
import { zodResolver } from "@hookform/resolvers/zod";
import { DialogDescription } from "@radix-ui/react-dialog";
import { useEffect } from "react";

type Props = {
  initialData?: Partial<NameFormData>;
  isPending: boolean;
  error: Error | null;
  onSubmit: SubmitHandler<NameFormData>;
};

export const NameSchema = CollectionItemParamsSchema.pick({ name: true });
export type NameFormData = z.infer<typeof NameSchema>;

export function NamingRouteForm(props: Props) {
  const { isPending, error, onSubmit } = props;
  const { register, handleSubmit } = useForm<NameFormData>({
    resolver: zodResolver(NameSchema),
    defaultValues: props.initialData,
  });
  const { shakeClassName, triggerShake } = useShake();

  useEffect(() => {
    if (isPending || !error) {
      return;
    }

    triggerShake();
  }, [error, triggerShake, isPending]);

  return (
    <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <DialogTitle className="text-md text-muted-foreground">
          Request Name
        </DialogTitle>
        <DialogDescription className="text-sm text-gray-200">
          You can (optionally) customize the name of this specific combination
          of route and parameters.
        </DialogDescription>
        {error && (
          <p className="text-sm text-destructive-foreground">{error.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground" htmlFor="name">
          Name (optional)
        </Label>
        <Input
          {...register("name")}
          id="name"
          placeholder="i.e. create `user1`"
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
          Create
        </Button>
      </div>
    </form>
  );
}
