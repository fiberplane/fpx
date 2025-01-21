import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { KeyValueForm } from "../KeyValueForm";
import { enforceTerminalDraftParameter } from "../KeyValueForm";
import { useStudioStore } from "../store";
import { Authorizations } from "./Authorizations";

export function SettingsPage() {
  const {
    persistentAuthHeaders,
    addAuthorization,
    setPersistentAuthHeaders,
    useMockApiSpec,
    setUseMockApiSpec,
  } = useStudioStore(
    "persistentAuthHeaders",
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
                +
              </Button>
            </div>
          </div>
          <Authorizations />
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
}
