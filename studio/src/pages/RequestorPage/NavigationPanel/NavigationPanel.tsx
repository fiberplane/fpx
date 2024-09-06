import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/utils";
import { useSearchParams } from "react-router-dom";
import { RequestsPanel } from "./RequestsPanel";
import { RoutesPanel } from "./RoutesPanel";
import { BACKGROUND_LAYER } from "../styles";

const FILTER_TAB_KEY = "filter-tab";
const TAB_KEYS = ["routes", "requests"] as const;
type NavigationTab = (typeof TAB_KEYS)[number];

function getTab(searchParams: URLSearchParams): NavigationTab {
  const tab = searchParams.get(FILTER_TAB_KEY);
  if (tab && TAB_KEYS.includes(tab as NavigationTab)) {
    return tab as NavigationTab;
  }

  return "routes";
}

export function NavigationPanel() {
  const [params, setParams] = useSearchParams();
  const tab = getTab(params);

  return (
    <div
      className={cn(
        BACKGROUND_LAYER,
        "px-4 overflow-hidden border rounded-md",
        "h-full",
        "flex",
        "flex-col",
        "pt-4",
      )}
    >
      <Tabs
        value={tab}
        className="h-full"
        onValueChange={(tabValue) =>
          setParams(
            (value) => {
              value.set(FILTER_TAB_KEY, tabValue);
              return value;
            },
            { replace: true },
          )
        }
      >
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="routes">Routes</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
        </TabsList>
        <TabsContent value="routes" className="h-full pt-4">
          <RoutesPanel />
        </TabsContent>
        <TabsContent value="requests" className="h-full pt-4">
          <RequestsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
