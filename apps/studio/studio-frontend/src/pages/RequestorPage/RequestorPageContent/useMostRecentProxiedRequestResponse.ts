import { useActiveTraceId } from "@/hooks";
import { useMemo } from "react";
import type { ProxiedRequestResponse } from "../queries";
import { useActiveRoute, useStudioStore } from "../store";
import { sortProxiedRequestResponsesDescending } from "../utils";

/**
 * When you select a route from the route side panel,
 * this will look for the most recent request made against that route.
 */
export function useMostRecentProxiedRequestResponse(
  all: ProxiedRequestResponse[],
  overrideTraceId: string | null = null,
) {
  const { path: routePath } = useActiveRoute();
  const { path, method, sessionHistory } = useStudioStore(
    "path",
    "method",
    "sessionHistory",
  );

  const defaultTraceId = useActiveTraceId();
  const traceId = overrideTraceId ?? defaultTraceId;
  return useMemo<ProxiedRequestResponse | undefined>(() => {
    if (traceId) {
      const result = all.find(
        (r: ProxiedRequestResponse) => r?.app_responses?.traceId === traceId,
      );

      return result;
    }

    const matchingResponses = all?.filter(
      (r: ProxiedRequestResponse) =>
        r.app_requests?.requestRoute === routePath &&
        r.app_requests?.requestMethod === method &&
        r.app_responses?.traceId &&
        sessionHistory.includes(r.app_responses?.traceId),
    );

    // Descending sort by updatedAt
    matchingResponses?.sort(sortProxiedRequestResponsesDescending);

    const latestMatch = matchingResponses?.[0];

    if (latestMatch) {
      return latestMatch;
    }

    // HACK - We can try to match against the exact request URL
    //        This is a fallback to support the case where the route doesn't exist,
    //        perhaps because we made a request to a service we are not explicitly monitoring
    const matchingResponsesFallback = all?.filter(
      (r: ProxiedRequestResponse) =>
        r?.app_requests?.requestUrl === path &&
        r?.app_requests?.requestMethod === method &&
        r.app_responses?.traceId &&
        sessionHistory.includes(r.app_responses?.traceId),
    );

    matchingResponsesFallback?.sort(sortProxiedRequestResponsesDescending);

    return matchingResponsesFallback?.[0];
  }, [all, routePath, method, path, traceId, sessionHistory]);
}
