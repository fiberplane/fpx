import { Layout } from "@/Layout";
import { RequestorPage } from "@/garbage/RequestorPage";
import { useStudioStore } from "@/garbage/RequestorPage/store";
import { RequestMethodInputValueSchema } from "@/types";
import { useHandler } from "@fiberplane/hooks";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect } from "react";
import { z } from "zod";

const ApiRouteSchema = z.object({
  method: z.string().optional(),
  uri: z.string().optional(),
});

export const Route = createFileRoute("/")({
  component: Index,
  validateSearch: search => ApiRouteSchema.parse(search)
});

/**
 * The main page of the playground, a Fiberplane Studio-like interface for interacting with the API.
 */
function Index() {
  const search = Route.useSearch();
  const { updateMethod, updatePath, appRoutes, setActiveRoute } = useStudioStore("updateMethod", "updatePath", "appRoutes", "setActiveRoute");

  const updateActiveRoute = useCallback((method: string, path: string) => {
    const route = appRoutes.find((r) => r.method === method && r.path === path);
    if (route) {
      setActiveRoute(route);
    }
  }, [appRoutes, setActiveRoute]);


  useEffect(() => {
    // console.log('search', search)
    const { method, uri } = search || {};
    console.log('method', method, 'uri', uri)
    if (method && uri) {
      const validatedMethod = RequestMethodInputValueSchema.safeParse(method).data || "GET";
      updateMethod(validatedMethod);
      updatePath(uri);
      updateActiveRoute(validatedMethod, uri);
    } else {
      updateMethod("GET");
      updatePath("");
    }
  }, [search, updateMethod, updatePath, updateActiveRoute])
  return (
    <Layout>
      <RequestorPage />
    </Layout>
  );
}
