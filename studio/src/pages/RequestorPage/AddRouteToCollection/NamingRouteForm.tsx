import { type SubmitHandler, useForm } from "react-hook-form";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useShake } from "@/hooks";
import { useAddItemToCollection } from "@/queries";
import { cn } from "@/utils";
import {
  type ExtraRequestParams,
  ExtraRequestParamsSchema,
} from "@fiberplane/fpx-types";
import { zodResolver } from "@hookform/resolvers/zod";
import { DialogDescription } from "@radix-ui/react-dialog";

type Props = {
  collectionId: string;
  routeId: number;
  extraParams: ExtraRequestParams;
  onSuccess: (id: number) => void;
};

const NameSchema = ExtraRequestParamsSchema.pick({ name: true });
type NameFormData = z.infer<typeof NameSchema>;

export function NamingRouteForm(props: Props) {
  const { onSuccess, collectionId: id, extraParams, routeId } = props;
  const {
    mutate: addToCollection,
    failureReason: error,
    isPending,
  } = useAddItemToCollection(id);

  // const {
  // mutate: addCollection,
  // failureReason: error,
  // isPending,
  // } = useAddCollection();
  const onSubmit: SubmitHandler<NameFormData> = ({ name }) => {
    addToCollection(
      {
        routeId,
        extraParams: {
          ...extraParams,
          name,
        },
      },
      {
        onSuccess: (data) => {
          onSuccess(data.id);
        },
        onError: () => {
          triggerShake();
        },
      },
    );
  };

  const { register, handleSubmit } = useForm<NameFormData>({
    resolver: zodResolver(NameSchema),
  });
  const { shakeClassName, triggerShake } = useShake();

  return (
    <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <DialogTitle className="text-md text-muted-foreground text-center">
          Custom route name
        </DialogTitle>
        <DialogDescription>
          You can (optionally) customize the name this specific combination of
          route &amp; parameters;
        </DialogDescription>
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
