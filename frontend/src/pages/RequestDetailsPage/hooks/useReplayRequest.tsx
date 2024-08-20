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
  const id = span.span_id;
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

  console.log("Replay headers", replayHeaders);

  const replayBody = useMemo<string>(() => {
    const body = getRequestBody(span);
    return body ?? "";
  }, [span]);

  console.log("Replay body", replayBody);

  const canHaveRequestBody = useMemo<boolean>(() => {
    const ucMethod = method.toUpperCase();
    return ucMethod !== "GET" && ucMethod !== "HEAD";
  }, [method]);

  console.log(canHaveRequestBody);

  const requestQueryParams = useMemo<Record<string, string> | null>(() => {
    return getRequestQueryParams(span);
  }, [span]);

  const { mutate: makeRequest, isPending: isReplaying } = useMakeProxiedRequest(
    {},
  );

  const replay = useCallback(
    (e: React.FormEvent<HTMLButtonElement>) => {
      e.preventDefault();
      console.log("Replay request");
      return makeRequest({
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
      });
    },
    [
      canHaveRequestBody,
      makeRequest,
      method,
      replayBaseUrl,
      replayPath,
      replayBody,
      requestHeaders,
      requestQueryParams,
      replayHeaders,
    ],
  );

  return {
    replay,
    isReplaying,
  };
}
