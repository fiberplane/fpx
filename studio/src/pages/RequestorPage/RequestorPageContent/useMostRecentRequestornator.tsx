// import { useOtelTraces } from "@/queries";
import { useMemo } from "react";
import type { ProxiedRequestResponse } from "../queries";
import { useActiveRoute, useRequestorStore } from "../store";
import { sortRequestornatorsDescending } from "../utils";

/**
 * When you select a route from the route side panel,
 * this will look for the most recent request made against that route.
 */
export function useMostRecentRequestornator(
  all: ProxiedRequestResponse[],
  overrideTraceId: string | null = null,
) {
  const { path: routePath } = useActiveRoute();
  const { path, method, activeHistoryResponseTraceId, sessionHistory } =
    useRequestorStore(
      "path",
      "method",
      "activeHistoryResponseTraceId",
      "sessionHistory",
    );

  const traceId = overrideTraceId ?? activeHistoryResponseTraceId;
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
        r.app_responses.traceId &&
        sessionHistory.includes(r.app_responses?.traceId),
    );

    // Descending sort by updatedAt
    matchingResponses?.sort(sortRequestornatorsDescending);

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
        r.app_responses.traceId &&
        sessionHistory.includes(r.app_responses?.traceId),
    );

    matchingResponsesFallback?.sort(sortRequestornatorsDescending);

    return matchingResponsesFallback?.[0];
  }, [all, routePath, method, path, traceId, sessionHistory]);
}
