import { useQuery } from "@tanstack/react-query";
import type { ProxiedRequestResponse } from "../queries";
import type { RequestBodyType } from "../store";
import type { ProbedRoute } from "../types";
import { simplifyHistoryEntry } from "./utils";

/**
 * NOTE - This is a temporary endpoint to test the expand-function endpoint
 */
export const expandFunction = (handler: string | undefined) => {
  if (!handler) {
    return Promise.reject(new Error("No handler provided"));
  }
  return fetch("/v0/expand-function", {
    method: "POST",
    body: JSON.stringify({ handler }),
  });
};

export const fetchAiRequestData = async (
  route: ProbedRoute | null,
  middleware: ProbedRoute[] | null,
  bodyType: RequestBodyType,
  history: Array<ProxiedRequestResponse>,
  persona: string,
) => {
  // FIXME - type wonkiness
  const { handler, method, path, openApiSpec } = route ?? {};

  // NOTE - Uncomment this to use the expand-function endpoint without hitting the AI
  // await expandFunction(handler);
  // throw new Error("Not implemented");

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
  history: Array<ProxiedRequestResponse>,
  persona = "Friendly",
  enabled = false,
) {
  return useQuery({
    queryKey: ["generateRequest"],
    queryFn: () =>
      fetchAiRequestData(route, matchingMiddleware, bodyType, history, persona),
    enabled,
    retry: false,
  });
}
