import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useHandler } from "@fiberplane/hooks";
import { TrashIcon } from "lucide-react";
import { useState } from "react";
import { useStudioStore } from "../../store";
import { BusyInput } from "./BusyInput";

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
        {/* biome-ignore lint/a11y/noLabelWithoutControl: BusyInput is also an input */}
        <label className="flex items-center space-x-2">Bearer</label>
        <BusyInput
          type="text"
          id={`token-${id}`}
          ref={isNew ? ref : undefined}
          value={token}
          className="font-mono "
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
        <div className="col-start-2 text-xs text-muted-foreground px-3 max-w-[400px] md:max-w-[500px] flex items-center gap-1">
          Results in:{" "}
          <code className="font-mono border text-foreground px-1 py-0.5 rounded-sm whitespace-nowrap overflow-hidden text-ellipsis flex-1">
            Authorization: Bearer {token || "<token>"}
          </code>
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
