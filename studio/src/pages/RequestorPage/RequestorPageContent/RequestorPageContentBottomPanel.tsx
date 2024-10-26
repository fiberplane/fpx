import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { cn } from "@/utils";
import { Icon } from "@iconify/react";
import { LogsTable } from "../LogsTable";
import { LogsLabel } from "../LogsTable";
import { RequestorTimeline } from "../RequestorTimeline";
import { CustomTabTrigger, CustomTabsContent, CustomTabsList } from "../Tabs";
import { AiTestGenerationPanel } from "../ai";
import type { ProxiedRequestResponse } from "../queries";
import { useRequestorStore } from "../store";
import type { BOTTOM_PANEL_NAMES } from "../store/slices/types";

interface RequestorPageContentBottomPanelProps {
  traceId?: string;
  history: ProxiedRequestResponse[];
}

const RequestorPageContentBottomPanel: React.FC<
  RequestorPageContentBottomPanelProps
> = (props: RequestorPageContentBottomPanelProps) => {
  const { traceId, history } = props;

  const { bottomPanels, bottomPanelIndex, setBottomPanelIndex } =
    useRequestorStore(
      "bottomPanels",
      "bottomPanelIndex",
      "togglePanel",
      "setBottomPanelIndex",
    );
  const activePanel =
    bottomPanelIndex !== undefined ? bottomPanels[bottomPanelIndex] : undefined;

  const renderTab = (panel: string) => {
    const [label] = panel.split("Panel");

    return (
      <CustomTabTrigger key={label} value={panel}>
        {label === "logs" ? (
          <LogsLabel traceId={traceId} />
        ) : (
          <div className="capitalize">
            {label?.toLowerCase() === "ai" ? "AI" : label}
          </div>
        )}
      </CustomTabTrigger>
    );
  };

  return (
    <div className="h-full b">
      <Tabs
        value={activePanel}
        onValueChange={(value) => {
          const index = bottomPanels.indexOf(value as BOTTOM_PANEL_NAMES);
          if (index !== -1) {
            setBottomPanelIndex(index);
          }
        }}
        className={cn(
          "border-none sm:border-r",
          "grid grid-rows-[auto_1fr]",
          "lg:overflow-hidden lg:h-full max-h-full",
        )}
      >
        <CustomTabsList className="justify-start">
          <div className="grow flex space-x-6">
            {bottomPanels.map((panel) => {
              return renderTab(panel);
            })}
          </div>
          <Button
            onClick={() => setBottomPanelIndex(undefined)}
            variant="ghost"
            size="icon"
            className={cn("h-6 w-6", "float-right")}
          >
            <Icon icon="lucide:x" />
          </Button>
        </CustomTabsList>
        <CustomTabsContent value="aiPanel">
          <AiTestGenerationPanel history={history} />
        </CustomTabsContent>
        <CustomTabsContent value="logsPanel">
          <LogsTable traceId={traceId} />
        </CustomTabsContent>
        <CustomTabsContent value="timelinePanel">
          <RequestorTimeline traceId={traceId} />
        </CustomTabsContent>
      </Tabs>
    </div>
  );
};

export default RequestorPageContentBottomPanel;
