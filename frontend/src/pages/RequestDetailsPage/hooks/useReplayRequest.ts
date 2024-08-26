import { useMakeProxiedRequest } from "@/pages/RequestorPage/queries";
import type { OtelSpan } from "@/queries";
import { useCallback, useMemo } from "react";
import {
  getRequestBody,
  getRequestHeaders,
  getRequestMethod,
  getRequestQueryParams,
  getRequestUrl,
} from "../v2/otel-helpers";

export function useReplayRequest({ span }: { span: OtelSpan }) {
  const method = getRequestMethod(span);

  const pathWithSearch = useMemo<string>(() => {
    return getRequestUrl(span);
  }, [span]);

  const url = new URL(pathWithSearch);
  const replayBaseUrl = url.origin;
  const replayPath = url.pathname;

  const requestHeaders = useMemo<Record<string, string>>(() => {
    return getRequestHeaders(span) ?? {};
  }, [span]);

  const filterReplayHeaders = useCallback(
    (
      headers: Array<{
        key: string;
        value: string;
        id: string;
        enabled: boolean;
      }>,
    ) => {
      const excludedHeaders = [
        "x-fpx-trace-id",
        "transfer-encoding",
        "content-length",
        "host",
        "connection",
        "accept-encoding",
        "user-agent",
        "referer",
        "origin",
        "cookie",
        "sec-fetch-site",
        "sec-fetch-mode",
        "sec-fetch-dest",
        "sec-ch-ua",
        "sec-ch-ua-mobile",
        "sec-ch-ua-platform",
        "pragma",
        "cache-control",
        "te",
      ];

      return headers.filter(
        (header) => !excludedHeaders.includes(header.key.toLowerCase()),
      );
    },
    [],
  );

  const replayHeaders = useMemo(() => {
    const headers = Object.entries(requestHeaders).map(([key, value]) => ({
      id: key,
      key,
      value,
      enabled: true,
    }));

    return filterReplayHeaders(headers);
  }, [requestHeaders, filterReplayHeaders]);

  const replayBody = useMemo(() => {
    const body = getRequestBody(span);
    return {
      type: "json",
      value: body ?? "",
    };
  }, [span]);

  const canHaveRequestBody = useMemo<boolean>(() => {
    const ucMethod = method.toUpperCase();
    return ucMethod !== "GET" && ucMethod !== "HEAD";
  }, [method]);

  const requestQueryParams = useMemo<Record<string, string> | null>(() => {
    return getRequestQueryParams(span);
  }, [span]);

  const { mutate: makeRequest, isPending: isReplaying } = useMakeProxiedRequest(
    {},
  );

  const replay = useCallback(
    (e: React.FormEvent<HTMLButtonElement>) => {
      e.preventDefault();
      return makeRequest(
        {
          addServiceUrlIfBarePath: (replayPath) => replayBaseUrl + replayPath,
          body: canHaveRequestBody ? replayBody : undefined,
          headers: replayHeaders,
          method,
          path: replayPath,
          queryParams: Object.entries(requestQueryParams ?? {}).map(
            ([key, value]) => ({
              id: key,
              key,
              value,
              enabled: true,
            }),
          ),
        },
        {
          onSuccess(data) {
            const traceId = data?.traceId;
          },
        },
      );
    },
    [
      canHaveRequestBody,
      makeRequest,
      method,
      replayBaseUrl,
      replayPath,
      replayBody,
      replayHeaders,
      requestQueryParams,
    ],
  );

  return {
    replay,
    isReplaying,
  };
}
