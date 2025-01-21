import { ModeToggle } from "@/components/mode-toggle";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { KeyValueForm } from "../KeyValueForm";
import { enforceTerminalDraftParameter } from "../KeyValueForm";
import { useStudioStore } from "../store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Authorization } from "../store/slices/settingsSlice";
import { TrashIcon } from "lucide-react";

export function SettingsPage() {
  const {
    persistentAuthHeaders,
    authorizations,
    addAuthorization,
    setPersistentAuthHeaders,
    useMockApiSpec,
    setUseMockApiSpec,
  } = useStudioStore(
    "persistentAuthHeaders",
    "authorizations",
    "addAuthorization",
    "setPersistentAuthHeaders",
    "useMockApiSpec",
    "setUseMockApiSpec",
  );

  return (
    <div className="p-8 max-w-2xl space-y-12">
      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-end">
              <div>

                <h2 className="text-lg font-semibold">Authentication</h2>
                <p className="text-sm text-muted-foreground">
                  These settings will be persisted across sessions.
                </p>
              </div>
              <Button onClick={() => addAuthorization({
                id: crypto.randomUUID(),
                name: "",
                type: "bearer",
                token: "",
              })}
                size="icon"
                variant={"secondary"}
              >+</Button>
            </div>
          </div>
          <div className="p-4 border rounded-lg">
            <div>
              {authorizations.length === 0 && (
                <div className="text-sm text-muted-foreground flex gap-2 items-center justify-center">
                  No authorizations found.
                  <Button onClick={() => addAuthorization({
                    id: crypto.randomUUID(),
                    name: "",
                    type: "bearer",
                    token: "",
                  })}
                    size="icon"
                    variant={"secondary"}
                  >Add</Button> your first one.

                </div>)
              }
              {authorizations.map((auth) => (
                <AuthorizationForm auth={auth} key={auth.id} />
              ))}
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Authentication Headers</h2>
            <p className="text-sm text-muted-foreground">
              These headers will be included in every request.
            </p>
          </div>
          <div className="p-4 border rounded-lg">
            <KeyValueForm
              keyValueParameters={persistentAuthHeaders}
              onChange={(headers) => {
                setPersistentAuthHeaders(
                  enforceTerminalDraftParameter(headers),
                );
              }}
              keyPlaceholder="Authorization"
              keyInputType="header-key"
              valueInputType="header-value"
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">API Specification</h2>
            <p className="text-sm text-muted-foreground">
              When enabled, a mock API specification will be used instead of
              loading one programmatically.
            </p>
          </div>
          <div className="flex items-center space-x-4 p-4 border rounded-lg ">
            <Switch
              id="mock-api"
              checked={useMockApiSpec}
              onCheckedChange={setUseMockApiSpec}
            />
            <label
              htmlFor="mock-api"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Use mock API specification
            </label>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Theme</h2>
            <p className="text-sm text-muted-foreground">
              Customize the appearance of your application.
            </p>
          </div>
          <div className="p-4 border rounded-lg ">
            <ModeToggle />
          </div>
        </div>
      </div>
    </div>
  );

  function AuthorizationForm(props: { auth: Authorization }) {
    const { auth } = props;

    if (auth.type === "bearer") {
      return <BearerForm id={auth.id} token={auth.token} name={auth.name} />;
    }

    return <div>Not supported</div>
  }
}

function BearerForm(props: { id: string, token: string, name?: string }) {
  const { id, token, name } = props;
  console.log('id', id);

  const { updateAuthorization, removeAuthorization } = useStudioStore("updateAuthorization", "removeAuthorization");

  return <div>
    <h2>Bearer token</h2>
    <div className="grid grid-cols-[1fr_auto] gap-2">
      <Input type="text" value={token} name="token" placeholder="token" onChange={(event) => updateAuthorization({ id, name, type: "bearer", token: event.target.value })} />
      <Button variant="destructive" size="icon" onClick={() => removeAuthorization(id)}><TrashIcon /></Button>
    </div>
  </div>;

}
