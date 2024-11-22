import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useShake } from "@/hooks";
import { useAddGroup } from "@/queries";
import { cn } from "@/utils";
import { type Group, GroupSchema } from "@fiberplane/fpx-types";
import { zodResolver } from "@hookform/resolvers/zod";
import { type SubmitHandler, useForm } from "react-hook-form";

type GroupFormData = {
  name: string;
};

type Props = {
  onSuccess: (group: Group) => void;
};

const CreateGroupSchema = GroupSchema.pick({ name: true });

export function CreateGroupForm(props: Props) {
  const { onSuccess } = props;
  const { mutate: addGroup, failureReason: error, isPending } = useAddGroup();
  const onSubmit: SubmitHandler<GroupFormData> = ({
    name,
  }: {
    name: string;
  }) => {
    addGroup(
      {
        name,
      },
      {
        onSuccess: (data) => {
          onSuccess(data);
        },
        onError: (error) => {
          console.log("validate", CreateGroupSchema.parse({ name }));
          console.log("error", error);
          triggerShake();
        },
      },
    );
  };

  const { register, handleSubmit } = useForm<GroupFormData>({
    resolver: zodResolver(CreateGroupSchema),
  });
  const { shakeClassName, triggerShake } = useShake();

  return (
    <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <h4 className="text-md text-muted-foreground text-center">New group</h4>
        {error && (
          <p className="text-sm text-destructive-foreground">{error.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground" htmlFor="groupName">
          Name
        </Label>
        <Input
          {...register("name")}
          id="groupName"
          type="text"
          className="col-span-2 h-8 font-mono"
          autoFocus
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
