import { useQuery } from "@tanstack/react-query";
import type { ProbedRoute, Requestornator } from "../queries";
import type { RequestBodyType } from "../reducer";
import { simplifyHistoryEntry } from "./utils";

const fetchAiRequestData = (
  route: ProbedRoute | null,
  middleware: ProbedRoute[] | null,
  bodyType: RequestBodyType,
  history: Array<Requestornator>,
  persona: string,
) => {
  // FIXME - type wonkiness
  const { handler, method, path, openApiSpec } = route ?? {};
  const simplifiedHistory = history.map(simplifyHistoryEntry);
  return fetch("/v0/generate-request", {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({
      handler,
      method,
      path,
      bodyType,
      history: simplifiedHistory,
      persona,
      openApiSpec,
      middleware,
    }),
  }).then(async (r) => {
    if (!r.ok) {
      const payload = await r.json().catch(() => null);
      throw new Error(payload?.message || "Failed to generate request data");
    }
    return r.json();
  });
};

export function useAiRequestData(
  route: ProbedRoute | null,
  matchingMiddleware: ProbedRoute[] | null,
  bodyType: RequestBodyType,
  history: Array<Requestornator>,
  persona = "Friendly",
) {
  return useQuery({
    queryKey: ["generateRequest"],
    queryFn: () =>
      fetchAiRequestData(route, matchingMiddleware, bodyType, history, persona),
    enabled: false,
    retry: false,
  });
}
