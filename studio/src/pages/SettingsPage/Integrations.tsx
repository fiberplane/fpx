import { Button } from "@/components/ui/button";
import { cn } from "@/utils";
import type { Settings } from "@fiberplane/fpx-types";
import { Icon } from "@iconify/react";
import { useState } from "react";
import { ApiKeyInput } from "./AISettingsForm";
import { useSettingsForm } from "./form";

export function Integrations({ settings }: { settings: Settings }) {
  const { form, onSubmit } = useSettingsForm(settings);
  const [isExpanded, setIsExpanded] = useState(false);

  const supabaseApiKey = form.watch("supabaseApiKey");
  const isConnected = Boolean(supabaseApiKey);

  const handleSupabaseConnect = () => {
    if (!supabaseApiKey) {
      return;
    }

    onSubmit(form.getValues());
    setIsExpanded(false);
  };

  const handleDisconnect = () => {
    form.setValue("supabaseApiKey", "");
    onSubmit(form.getValues());
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Integrations</h3>
      </div>
      <div className="space-y-4">
        <IntegrationItem
          label="Supabase"
          description="Enable auth integration and user impersonation for endpoint testing"
          button={isConnected ? "Disconnect" : "Add Supabase"}
          onClick={() => {
            if (isConnected) {
              handleDisconnect();
            } else {
              setIsExpanded(!isExpanded);
            }
          }}
          connected={isConnected}
          expanded={isExpanded}
        >
          <div className="mt-4 space-y-4">
            <ApiKeyInput
              value={form.getValues("supabaseApiKey") ?? ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                form.setValue("supabaseApiKey", e.target.value)
              }
              placeholder="Enter your Supabase API key"
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsExpanded(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSupabaseConnect}
                disabled={!form.getValues("supabaseApiKey")}
              >
                Connect
              </Button>
            </div>
          </div>
        </IntegrationItem>
      </div>
    </div>
  );
}

function IntegrationItem({
  label,
  description,
  button,
  onClick,
  connected = false,
  expanded = false,
  children,
}: {
  label: string;
  description: string;
  button: string | React.ReactNode;
  onClick: () => void;
  connected?: boolean;
  expanded?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-lg border p-4")}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <p className="text-sm font-medium">{label}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <Button
          onClick={onClick}
          variant={typeof button === "string" ? "default" : "link"}
          className={cn({
            "text-muted-foreground": connected,
          })}
        >
          {typeof button === "string" ? (
            connected ? (
              <>
                <Icon icon="lucide:check" className="w-4 h-4 mr-2" />
                Connected
              </>
            ) : (
              <>
                <Icon
                  icon={expanded ? "lucide:minus" : "lucide:plus"}
                  className="w-4 h-4 mr-2"
                />
                {button}
              </>
            )
          ) : (
            button
          )}
        </Button>
      </div>
      {expanded && children}
    </div>
  );
}
