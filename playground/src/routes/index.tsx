import { Layout } from "@/Layout";
import { RequestorPage } from "@/garbage/RequestorPage";
import { useStudioStore } from "@/garbage/RequestorPage/store";
import { RequestMethodInputValueSchema } from "@/types";
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
  const {
    updateMethod,
    updatePath,
    appRoutes,
    setActiveRoute,
    clearPathParams,
  } = useStudioStore(
    "updateMethod",
    "updatePath",
    "appRoutes",
    "setActiveRoute",
    "clearPathParams",
  );

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
    clearPathParams();
    if (appRoutes.length > 0) {
      const route = appRoutes[0];
      updateMethod(route.method);
      updatePath(route.path);
      setActiveRoute(route);
    } else {
      updateMethod("GET");
      updatePath("");
    }
  });

  useEffect(() => {
    const { method, uri } = search || {};
    if (method && uri) {
      const validatedMethod =
        RequestMethodInputValueSchema.safeParse(method).data || "GET";
      updateMethod(validatedMethod);
      updatePath(uri);
      clearPathParams();
      updateActiveRoute(validatedMethod, uri);
    } else {
      setDefault();
    }
  }, [
    search,
    updateMethod,
    updatePath,
    updateActiveRoute,
    setDefault,
    clearPathParams,
  ]);

  return (
    <Layout>
      <RequestorPage />
    </Layout>
  );
}
