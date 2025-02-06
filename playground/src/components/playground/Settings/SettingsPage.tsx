import { ModeToggle } from "@/components/mode-toggle";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { FEATURE_FLAG_TRACES, FEATURE_FLAG_WORKFLOWS } from "@/constants";
import { useStudioStore } from "../store";
import { Auths } from "./Auths";

export function SettingsPage() {
  const {
    useMockApiSpec,
    setUseMockApiSpec,
    setFeatureEnabled,
    isWorkflowsEnabled,
    isTracingEnabled,
  } = useStudioStore(
    "useMockApiSpec",
    "setUseMockApiSpec",
    "setFeatureEnabled",
    "isWorkflowsEnabled",
    "isTracingEnabled",
  );

  return (
    <div className="p-8 max-w-2xl space-y-12">
      <div className="space-y-6">
        <div className="space-y-4">
          <Auths />
        </div>
        <Separator />

        {
          // Hide the option to use a mock API spec in production
          process.env.NODE_ENV !== "production" && (
            <>
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">API Specification</h2>
                  <p className="text-sm text-muted-foreground">
                    When enabled, a mock API specification will be used instead
                    of loading one programmatically.
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
                    Use mock API spec (local development only)
                  </label>
                </div>
              </div>
              <Separator />
            </>
          )
        }

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

        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Experimental Features</h2>
            <p className="text-sm text-muted-foreground">
              Enable or disable experimental features in the playground.
            </p>
          </div>
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center space-x-4">
              <Switch
                id="feature-workflows"
                checked={isWorkflowsEnabled}
                onCheckedChange={(enabled) =>
                  setFeatureEnabled(FEATURE_FLAG_WORKFLOWS, enabled)
                }
              />
              <div className="space-y-1.5">
                <label
                  htmlFor="feature-workflows"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Workflows
                </label>
                <p className="text-sm text-muted-foreground">
                  Enable support for creating and managing API workflow.
                  Requires an API key from Fiberplane.
                </p>
              </div>
            </div>
            <Separator />

            <div className="flex items-center space-x-4">
              <Switch
                id="feature-traces"
                checked={isTracingEnabled}
                onCheckedChange={(enabled) =>
                  setFeatureEnabled(FEATURE_FLAG_TRACES, enabled)
                }
              />
              <div className="space-y-1.5">
                <label
                  htmlFor="feature-traces"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  OpenTelemetry Traces
                </label>
                <p className="text-sm text-muted-foreground">
                  Enable visualization and analysis of OpenTelemetry traces for
                  your API requests. Contact Fiberplane to set this up.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
