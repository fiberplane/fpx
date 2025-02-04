import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { useRef } from "react";
import { useStudioStore } from "../../store";
import { AuthForm } from "./AuthForm";

export function Auths() {
  const { authorizations, addAuthorization } = useStudioStore(
    "authorizations",
    "addAuthorization",
  );
  const newRef = useRef<null | string>(null);

  return (
    <div className="grid gap-4">
      <div>
        <h2 className="text-lg font-semibold">Auth</h2>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">
              These auth configurations are persisted across sessions. You may
              want to manually clear these values after use.
            </p>
          </div>
          <div className="ml-4 min-w-9">
            <Button
              onClick={() => {
                const id = crypto.randomUUID();
                newRef.current = id;
                addAuthorization({
                  id,
                  name: "",
                  type: "bearer",
                  token: "",
                });
              }}
              size="icon"
              variant={"secondary"}
            >
              <PlusIcon size="12" />
            </Button>
          </div>
        </div>
      </div>
      <div className="p-4 border rounded-lg">
        {authorizations.length === 0 && (
          <div className="text-sm text-muted-foreground flex gap-2 items-center justify-center">
            No auth configurations found.
            <Button
              onClick={() => {
                const id = crypto.randomUUID();
                newRef.current = id;
                addAuthorization({
                  id,
                  name: "",
                  type: "bearer",
                  token: "",
                });
              }}
              className="h-6 text-xs p-1 text-foreground/70 inline-flex items-center gap-1"
              size="sm"
              variant={"secondary"}
            >
              <PlusIcon
                size="12"
                style={{ height: "0.75rem", width: "0.75rem" }}
              />{" "}
              Add
            </Button>
            your first one.
          </div>
        )}
        {authorizations.length > 0 && (
          <div className="text-xs text-muted-foreground/70 -mt-2 mb-3 border-b pb-0.5 flex items-center gap-1">
            Changes to auth tokens are instantly saved to your browser's local
            storage
          </div>
        )}
        <div className="flex gap-6 flex-col">
          {authorizations.map((auth) => (
            <AuthForm
              auth={auth}
              key={auth.id}
              isNew={auth.id === newRef.current}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
