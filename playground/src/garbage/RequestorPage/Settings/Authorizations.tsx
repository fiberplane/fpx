import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrashIcon } from "lucide-react";
import { useStudioStore } from "../store";
import type { Authorization } from "../store/slices/settingsSlice";

export function Authorizations() {
  const { authorizations, addAuthorization } = useStudioStore(
    "authorizations",
    "addAuthorization",
  );

  return (
    <div className="p-4 border rounded-lg">
      {authorizations.length === 0 && (
        <div className="text-sm text-muted-foreground flex gap-2 items-center justify-center">
          No authorizations found.
          <Button
            onClick={() =>
              addAuthorization({
                id: crypto.randomUUID(),
                name: "",
                type: "bearer",
                token: "",
              })
            }
            size="icon"
            variant={"secondary"}
          >
            Add
          </Button>
          your first one.
        </div>
      )}
      {authorizations.map((auth) => (
        <AuthorizationForm auth={auth} key={auth.id} />
      ))}
    </div>
  );
}

function AuthorizationForm(props: { auth: Authorization }) {
  const { auth } = props;
  if (auth.type === "bearer") {
    return <BearerForm id={auth.id} token={auth.token} name={auth.name} />;
  }

  return <div>Not supported</div>;
}

function BearerForm(props: { id: string; token: string; name?: string }) {
  const { id, token, name } = props;
  console.log("id", id);

  const { updateAuthorization, removeAuthorization } = useStudioStore(
    "updateAuthorization",
    "removeAuthorization",
  );

  return (
    <div>
      <h2>Bearer token</h2>
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <Input
          type="text"
          value={token}
          placeholder="token"
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
          onClick={() => removeAuthorization(id)}
        >
          <TrashIcon />
        </Button>
      </div>
    </div>
  );
}
