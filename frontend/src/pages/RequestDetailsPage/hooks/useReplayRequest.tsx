import { OtelSpan } from "@/queries";
import {
  getMatchedRoute,
  getRequestBody,
  getRequestHeaders,
  getRequestMethod,
  getRequestQueryParams,
  getRequestUrl,
} from "../v2/otel-helpers";
import { useCallback, useMemo } from "react";
import { useMakeProxiedRequest } from "@/pages/RequestorPage/queries";

export function useReplayRequest({ span: span }: { span: OtelSpan }) {
  const id = span.span_id;
  const method = getRequestMethod(span);

  const pathWithSearch = useMemo<string>(() => {
    return getRequestUrl(span);
  }, [span]);

  const url = new URL(pathWithSearch);

  const requestHeaders = useMemo<Record<string, string>>(() => {
    return getRequestHeaders(span) ?? {};
  }, [span]);

  const requestBody = useMemo<string>(() => {
    const body = getRequestBody(span);
    return body ?? "";
  }, [span]);

  const canHaveRequestBody = useMemo<boolean>(() => {
    const ucMethod = method.toUpperCase();
    return ucMethod !== "GET" && ucMethod !== "HEAD";
  }, [method]);

  const requestQueryParams = useMemo<Record<string, string> | null>(() => {
    return getRequestQueryParams(span);
  }, [span]);

  const { mutate: makeRequest, isPending: isReplaying } =
    useMakeProxiedRequest({ });

  const replay = useCallback((e: React.FormEvent<HTMLFormElement>) => {
  	e.preventDefault()
  	return makeRequest({ })
  }, [])



  return {
   	replay,
    isReplaying
  };
}
