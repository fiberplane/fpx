import { Button } from "@/components/ui/button";
import { cn } from "@/utils";
import type { Settings } from "@fiberplane/fpx-types";
import { Icon } from "@iconify/react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export function Integrations({ settings: _settings }: { settings: Settings }) {
  const [supabaseKey, setSupabaseKey] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSupabaseConnect = () => {
    // TODO: Implement Supabase connection logic
    console.log("Connecting with key:", supabaseKey);
    setSupabaseKey("");
    setIsExpanded(false);
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
          button="Add Supabase"
          onClick={() => setIsExpanded(!isExpanded)}
          expanded={isExpanded}
        >
          <div className="mt-4 space-y-4">
            <Input
              type="password"
              placeholder="Enter your Supabase API key"
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsExpanded(false)}>
                Cancel
              </Button>
              <Button onClick={handleSupabaseConnect} disabled={!supabaseKey}>
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
                <Icon icon={expanded ? "lucide:minus" : "lucide:plus"} className="w-4 h-4 mr-2" />
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
