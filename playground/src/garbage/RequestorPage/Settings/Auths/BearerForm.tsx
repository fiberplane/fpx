import { Input } from "@/components/ui/input";
import { useStudioStore } from "../../store";
import { Button } from "@/components/ui/button";
import { TrashIcon } from "lucide-react";
import { useRef, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { useHandler } from "@fiberplane/hooks";

export function BearerForm(props: {
  id: string;
  token: string;
  name?: string;
  isNew?: boolean;
}) {
  const { id, token, name, isNew } = props;

  const { updateAuthorization, removeAuthorization } = useStudioStore(
    "updateAuthorization",
    "removeAuthorization",
  );

  const ref = useHandler((node: HTMLInputElement | null) => {
    if (node) {
      node.focus();
    }
  });

  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-[auto_1fr_32px] gap-2">
        {/* biome-ignore lint/a11y/noLabelWithoutControl: Input is also an input */}
        <label className="flex items-center space-x-2">
          Bearer</label>
        <Input
          type="text"
          id={`token-${id}`}
          ref={isNew ? ref : undefined}
          value={token}
          className="font-mono"
          placeholder="token"
          autoFocus={isNew}
          onChange={(event) =>
            updateAuthorization({
              id,
              name,
              type: "bearer",
              token: event.target.value,
            })
          }
        />
        <Button
          variant="destructive"
          size="icon"
          onClick={() => setConfirmDelete(true)}
        >
          <TrashIcon />
        </Button>
        <div className="col-start-2 text-xs text-muted-foreground px-4">
          Results in: <code className="font-mono">Authorization: Bearer {token || "your_token_here"}</code>
        </div>
      </div>
      <Dialog onOpenChange={setConfirmDelete} open={confirmDelete}>
        <ConfirmationDialog
          className="max-w-screen-sm w-96"
          title="Delete token?"
          description="This action cannot be undone."
          confirmText="Delete"
          onConfirm={() => {
            removeAuthorization(id);
          }}
          onCancel={() => setConfirmDelete(false)}
          confirmButtonVariant={"destructive"}
        />
      </Dialog>
    </div>
  );
}
