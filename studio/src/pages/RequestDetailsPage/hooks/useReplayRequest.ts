import { useMakeProxiedRequest } from "@/pages/RequestorPage/queries";
import { useRequestorStore } from "@/pages/RequestorPage/store";
import type { OtelSpan } from "@/queries";
import {
  getRequestBody,
  getRequestHeaders,
  getRequestMethod,
  getRequestQueryParams,
  getRequestUrl,
} from "@/utils";
import { useCallback, useMemo } from "react";

export function useReplayRequest({ span }: { span?: OtelSpan }) {
  const method = span ? getRequestMethod(span) : "GET";

  const pathWithSearch = useMemo<string>(() => {
    return span ? getRequestUrl(span) : "";
  }, [span]);

  const url = new URL(pathWithSearch);
  const replayBaseUrl = url.origin;
  const replayPath = url.pathname;

  const requestHeaders = useMemo<Record<string, string>>(() => {
    return span ? getRequestHeaders(span) ?? {} : {};
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
    const body = span ? getRequestBody(span) : undefined;
    try {
      JSON.parse(body ?? "");
      return {
        type: "json" as const,
        value: body ?? "",
      };
    } catch {
      return {
        type: "text" as const,
        value: body ?? "",
      };
    }
  }, [span]);

  const canHaveRequestBody = useMemo<boolean>(() => {
    const ucMethod = method.toUpperCase();
    return ucMethod !== "GET" && ucMethod !== "HEAD";
  }, [method]);

  const requestQueryParams = useMemo<Record<string, string> | null>(() => {
    return span ? getRequestQueryParams(span) : null;
  }, [span]);

  const { clearResponseBodyFromHistory, setActiveResponse } =
    useRequestorStore();

  const { mutate: makeRequest, isPending: isReplaying } = useMakeProxiedRequest(
    {
      clearResponseBodyFromHistory,
      setActiveResponse,
    },
  );

  const replay = useCallback(
    (e: React.FormEvent<HTMLButtonElement>) => {
      e.preventDefault();
      return makeRequest(
        {
          addServiceUrlIfBarePath: (replayPath) => replayBaseUrl + replayPath,
          body: canHaveRequestBody ? replayBody : { type: "text" },
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
          onError(error) {
            console.error("Error replaying request", error);
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

  if (!span) {
    return {
      replay: () => {},
      isReplaying: false,
    };
  }

  return {
    replay,
    isReplaying,
  };
}
