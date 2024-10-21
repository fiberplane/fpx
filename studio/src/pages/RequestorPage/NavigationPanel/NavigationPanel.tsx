import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useKeySequence } from "@/hooks/useKeySequence";
import { useHandler } from "@fiberplane/hooks";
import { useSearchParams } from "react-router-dom";
import { RequestsPanel } from "./RequestsPanel";
import { RoutesPanel } from "./RoutesPanel";

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

  const setTab = useHandler((newTab: NavigationTab) => {
    setParams({ [FILTER_TAB_KEY]: newTab }, { replace: true });
  });

  useKeySequence(
    ["g", "r"],
    () => {
      setTab("routes");
    },
    { ignoreSelector: "[contenteditable]" },
  );
  useKeySequence(
    ["g", "a"],
    () => {
      setTab("requests");
    },
    { ignoreSelector: "[contenteditable]" },
  );

  return (
    <Tabs
      value={tab}
      className="h-full"
      onValueChange={(tabValue: string) => setTab(tabValue as NavigationTab)}
    >
      <TabsList className="w-full grid grid-cols-2">
        {TAB_KEYS.map((tabKey) => (
          <TabsTrigger key={tabKey} value={tabKey}>
            {tabKey.charAt(0).toUpperCase() + tabKey.slice(1)}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="routes" className="h-[calc(100%-40px)] pt-4">
        <RoutesPanel />
      </TabsContent>
      <TabsContent value="requests" className="h-[calc(100%-40px)] pt-4">
        <RequestsPanel />
      </TabsContent>
    </Tabs>
  );
}
