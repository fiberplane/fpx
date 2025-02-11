import { ThemeSelect } from "@/components/theme-select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  DISCORD_INVITE_URL,
  FEATURE_FLAG_TRACES,
  FEATURE_FLAG_WORKFLOWS,
} from "@/constants";
import { useStudioStore } from "../store";
import { Auths } from "./Auths";

export function SettingsPage() {
  const { setFeatureEnabled, isWorkflowsEnabled, isTracingEnabled } =
    useStudioStore(
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

        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Theme</h2>
            <p className="text-sm text-muted-foreground">
              Customize the appearance of your application.
            </p>
          </div>
          <div className="p-4 border rounded-lg ">
            <ThemeSelect />
          </div>
        </div>
        <Separator />

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
                  Enable support for creating and managing API workflows.
                  Requires an API key from Fiberplane, which you can request in
                  <a
                    href={DISCORD_INVITE_URL}
                    className="text-primary/80 inline-flex ml-1 items-baseline underline gap-1 hover:text-primary"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Discord
                  </a>
                  .
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
