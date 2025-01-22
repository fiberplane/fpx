import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { useStudioStore } from "../../store";
import { AuthForm } from "./AuthForm";
import { useRef } from "react";

export function Auths() {
  const { authorizations, addAuthorization } = useStudioStore(
    "authorizations",
    "addAuthorization",
  );
  const newRef = useRef<null | string>(null);

  return (
    <div className="grid gap-4">
      <div>
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-lg font-semibold">Auth</h2>
            <p className="text-sm text-muted-foreground">
              These auth configurations will be persisted across sessions. So you may want to manually clear these values after use.
            </p>
          </div>
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
            +
          </Button>
        </div>
      </div>
      <div className="p-4 border rounded-lg flex gap-2 flex-col">
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
              size="sm"
              variant={"secondary"}
            >
              <PlusIcon size="16" /> Add
            </Button>
            your first one.
          </div>
        )}
        {authorizations.map((auth) => (
          <AuthForm
            auth={auth}
            key={auth.id}
            isNew={auth.id === newRef.current}
          />
        ))}
      </div>
    </div>
  );
}
