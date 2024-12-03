import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useShake } from "@/hooks";
import { useAddCollection } from "@/queries";
import { cn } from "@/utils";
import { type Collection, CollectionSchema } from "@fiberplane/fpx-types";
import { zodResolver } from "@hookform/resolvers/zod";
import { type SubmitHandler, useForm } from "react-hook-form";

type CollectionFormData = {
  collectionName: string;
};

type Props = {
  onSuccess: (collection: Collection) => void;
};

const CreateCollectionSchema = CollectionSchema.pick({ name: true });

export function CreateCollectionForm(props: Props) {
  const { onSuccess } = props;
  const {
    mutate: addCollection,
    failureReason: error,
    isPending,
  } = useAddCollection();
  const onSubmit: SubmitHandler<CollectionFormData> = ({ collectionName }) => {
    addCollection(
      {
        name: collectionName,
      },
      {
        onSuccess: (data) => {
          onSuccess(data);
        },
        onError: () => {
          triggerShake();
        },
      },
    );
  };

  const { register, handleSubmit } = useForm<CollectionFormData>({
    resolver: zodResolver(CreateCollectionSchema),
  });
  const { shakeClassName, triggerShake } = useShake();

  return (
    <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <h4 className="text-md text-muted-foreground text-center">
          New collection
        </h4>
        {error && (
          <p className="text-sm text-destructive-foreground">{error.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label
          className="text-sm text-muted-foreground"
          htmlFor="collectionName"
        >
          Name
        </Label>
        <Input
          {...register("collectionName")}
          id="collectionName"
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
