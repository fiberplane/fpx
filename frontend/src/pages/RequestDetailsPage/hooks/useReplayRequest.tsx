import { useMakeProxiedRequest } from "@/pages/RequestorPage/queries";
import { OtelSpan } from "@/queries";
import { useCallback, useMemo } from "react";
import {
  getRequestBody,
  getRequestHeaders,
  getRequestMethod,
  getRequestQueryParams,
  getRequestUrl,
} from "../v2/otel-helpers";

export function useReplayRequest({ span: span }: { span: OtelSpan }) {
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

  const replayHeaders = Object.entries(requestHeaders)
    .map(([key, value]) => ({
      id: key,
      key,
      value,
      enabled: true,
    }))
    .filter(
      (header) =>
        header.key.toLowerCase() !== "x-fpx-trace-id" &&
        header.key.toLowerCase() !== "transfer-encoding" &&
        header.key.toLowerCase() !== "content-length",
    );

  console.log("Replay headers", replayHeaders);

  const requestBody = useMemo<string>(() => {
    const body = getRequestBody(span);
    return body ?? "";
  }, [span]);

  console.log("Replay body", requestBody);

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
      console.log("Replay request");
      return makeRequest({
        addServiceUrlIfBarePath: (replayPath) => replayBaseUrl + replayPath,
        body: canHaveRequestBody ? requestBody : undefined,
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
      requestBody,
      requestHeaders,
      requestQueryParams,
    ],
  );

  return {
    replay,
    isReplaying,
  };
}
