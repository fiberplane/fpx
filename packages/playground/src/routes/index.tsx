import { Layout } from "@/Layout";
import { PlaygroundPage } from "@/components/playground";
import { useStudioStore } from "@/components/playground/store";
import { useSettingsOpen } from "@/hooks";
import { useHandler } from "@fiberplane/hooks";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect } from "react";
import { z } from "zod";

const SettingsRouteSchema = z.object({
  settings: z.boolean().optional(),
});

const ApiRouteSchema = SettingsRouteSchema.extend({
  method: z.string().optional(),
  uri: z.string().optional(),
});

export const Route = createFileRoute("/")({
  component: Index,
  validateSearch: (search) => ApiRouteSchema.parse(search),
});

/**
 * The main page of the playground, a Fiberplane Studio-like interface for interacting with the API.
 */
function Index() {
  const search = Route.useSearch();
  const { appRoutes, setActiveRoute } = useStudioStore(
    "appRoutes",
    "setActiveRoute",
  );

  const { setSettingsOpen } = useSettingsOpen();

  const updateActiveRoute = useCallback(
    (method: string, path: string) => {
      const route = appRoutes.find(
        (r) => r.method === method && r.path === path,
      );
      if (route) {
        setActiveRoute(route);
      }
    },
    [appRoutes, setActiveRoute],
  );

  const setDefault = useHandler(() => {
    if (appRoutes.length === 0) {
      // If there are no routes there isn't much to reset to.
      return;
    }
    const route = appRoutes[0];
    setActiveRoute(route);
  });

  const { settings: showSettings = false, method, uri } = search || {};
  useEffect(() => {
    setSettingsOpen(showSettings);
  }, [showSettings, setSettingsOpen]);

  useEffect(() => {
    if (method && uri) {
      updateActiveRoute(method, uri);
    } else {
      setDefault();
    }
  }, [method, uri, updateActiveRoute, setDefault]);

  return (
    <Layout>
      <PlaygroundPage />
    </Layout>
  );
}
