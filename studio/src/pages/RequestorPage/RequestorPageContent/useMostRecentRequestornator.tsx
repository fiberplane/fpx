import { useMemo } from "react";
import type { Requestornator } from "../queries";
import { useActiveRoute, useRequestorStore } from "../store";
import { sortRequestornatorsDescending } from "../utils";

/**
 * When you select a route from the route side panel,
 * this will look for the most recent request made against that route.
 */
export function useMostRecentRequestornator(
  all: Requestornator[],
  overrideTraceId: string | null = null,
) {
  const { path: routePath } = useActiveRoute();
  const { path, method, activeHistoryResponseTraceId } = useRequestorStore(
    "path",
    "method",
    "activeHistoryResponseTraceId",
  );

  const traceId = overrideTraceId ?? activeHistoryResponseTraceId;
  return useMemo<Requestornator | undefined>(() => {
    if (traceId) {
      return all.find(
        (r: Requestornator) => r?.app_responses?.traceId === traceId,
      );
    }

    const matchingResponses = all?.filter(
      (r: Requestornator) =>
        r?.app_requests?.requestRoute === routePath &&
        r?.app_requests?.requestMethod === method,
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
      (r: Requestornator) =>
        r?.app_requests?.requestUrl === path &&
        r?.app_requests?.requestMethod === method,
    );

    matchingResponsesFallback?.sort(sortRequestornatorsDescending);

    return matchingResponsesFallback?.[0];
  }, [all, routePath, method, path, traceId]);
}