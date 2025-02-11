import { PROBED_ROUTES_KEY } from "@/queries";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export type Route = {
  path: string;
  method: string;
  handler?: string;
  handlerType?: "route" | "middleware";
  routeOrigin?: "discovered" | "custom" | "open_api";
  openApiSpec?: string;
  requestType?: "http" | "websocket";
  // NOTE - Added on the frontend, not stored in DB
  isDraft?: boolean;
};

async function addRoutes(routes: Route | Route[]) {
  return fetch("/v0/app-routes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(routes),
  }).then((r) => r.json());
}

export function useAddRoutes() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: addRoutes,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROBED_ROUTES_KEY] });
    },
  });

  return mutation;
}
