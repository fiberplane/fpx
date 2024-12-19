import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  NAVIGATION_PANEL_KEY,
  type NavigationTab,
  TAB_KEYS,
} from "@/constants";
import { useKeySequence } from "@/hooks/useKeySequence";
import { useHandler } from "@fiberplane/hooks";
import { useParams, useSearchParams } from "react-router-dom";
import { CollectionsPanel } from "./CollectionsPanel";
import { RequestsPanel } from "./RequestsPanel";
import { RoutesPanel } from "./RoutesPanel";

function getTab(searchParams: URLSearchParams): NavigationTab | undefined {
  const tab = searchParams.get(NAVIGATION_PANEL_KEY);
  if (tab && TAB_KEYS.includes(tab as NavigationTab)) {
    return tab as NavigationTab;
  }
}

function useActiveTab(): {
  tab: NavigationTab;
  setTab: (tab: NavigationTab) => void;
} {
  const [params, setParams] = useSearchParams();
  const { collectionId } = useParams();

  const tab = getTab(params) ?? (collectionId ? "collections" : "routes");

  const setTab = useHandler((newTab: NavigationTab) => {
    setParams({ [NAVIGATION_PANEL_KEY]: newTab }, { replace: true });
  });

  return {
    tab,
    setTab,
  };
}

export function NavigationPanel() {
  const { tab, setTab } = useActiveTab();

  useKeySequence(
    ["g", "r"],
    () => {
      setTab("routes");
    },
    { ignoreSelector: "[contenteditable]" },
  );
  useKeySequence(
    ["g", "h"],
    () => {
      setTab("history");
    },
    { ignoreSelector: "[contenteditable]" },
  );
  useKeySequence(
    ["g", "g"],
    () => {
      setTab("collections");
    },
    { ignoreSelector: "[contenteditable]" },
  );

  return (
    <Tabs
      value={tab}
      className="h-full"
      onValueChange={(tabValue: string) => setTab(tabValue as NavigationTab)}
    >
      <TabsList className="w-full grid grid-cols-3">
        {TAB_KEYS.map((tabKey) => (
          <TabsTrigger key={tabKey} value={tabKey}>
            {tabKey.charAt(0).toUpperCase() + tabKey.slice(1)}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="routes" className="h-[calc(100%-40px)] pt-4">
        <RoutesPanel />
      </TabsContent>
      <TabsContent value="history" className="h-[calc(100%-40px)] pt-4">
        <RequestsPanel />
      </TabsContent>
      <TabsContent value="collections" className="h-[calc(100%-40px)] pt-4">
        <CollectionsPanel />
      </TabsContent>
    </Tabs>
  );
}
