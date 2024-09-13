import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useKeySequence } from "@/hooks/useKeySequence";
import React, { useCallback, useMemo } from "react";
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

  const tabRefs = useMemo(() => {
    return TAB_KEYS.reduce(
      (acc, key) => {
        acc[key] = React.createRef<HTMLButtonElement>();
        return acc;
      },
      {} as Record<NavigationTab, React.RefObject<HTMLButtonElement>>,
    );
  }, []);

  const setTab = useCallback(
    (newTab: NavigationTab) => {
      setParams({ [FILTER_TAB_KEY]: newTab }, { replace: true });
    },
    [setParams],
  );

  useKeySequence(["g", "r"], () => {
    setTab("routes");
  });
  useKeySequence(["g", "a"], () => {
    setTab("requests");
  });

  return (
    <Tabs
      value={tab}
      className="h-full"
      onValueChange={(tabValue: string) => setTab(tabValue as NavigationTab)}
    >
      <TabsList className="w-full grid grid-cols-2">
        {TAB_KEYS.map((tabKey) => (
          <TabsTrigger key={tabKey} ref={tabRefs[tabKey]} value={tabKey}>
            {tabKey.charAt(0).toUpperCase() + tabKey.slice(1)}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="routes" className="pt-4">
        <RoutesPanel />
      </TabsContent>
      <TabsContent value="requests" className="pt-4">
        <RequestsPanel />
      </TabsContent>
    </Tabs>
  );
}
