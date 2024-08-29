import { Status } from "@/components/ui/status";
import { getHttpMethodTextColor } from "@/pages/RequestorPage/method";
import type { OtelSpan } from "@/queries";
import { SENSITIVE_HEADERS, cn } from "@/utils";
import { ClockIcon } from "@radix-ui/react-icons";
import { useMemo } from "react";
import { SectionHeading } from "../shared";
import { BodyViewerV2 } from "./BodyViewerV2";
import { CollapsibleKeyValueTableV2 } from "./KeyValueTableV2";
import {
  getMatchedRoute,
  getRequestBody,
  getRequestHeaders,
  getRequestMethod,
  getRequestQueryParams,
  getRequestUrl,
  getResponseBody,
  getResponseHeaders,
  getStatusCode,
} from "./otel-helpers";
import { Divider, SubSection, SubSectionHeading } from "./shared";

export function IncomingRequest({ span }: { span: OtelSpan }) {
  const id = span.span_id;
  const method = getRequestMethod(span);
  const duration = useMemo(() => {
    try {
      const duration =
        new Date(span.end_time).getTime() - new Date(span.start_time).getTime();
      return duration;
    } catch (e) {
      return null;
    }
  }, [span]);

  const pathWithSearch = useMemo<string>(() => {
    return getRequestUrl(span);
  }, [span]);

  const matchedRoute = useMemo<string>(() => {
    return getMatchedRoute(span);
  }, [span]);

  const requestHeaders = useMemo<Record<string, string>>(() => {
    return getRequestHeaders(span) ?? {};
  }, [span]);

  const requestBody = useMemo<string>(() => {
    const body = getRequestBody(span);
    return body ?? "";
  }, [span]);

  const responseHeaders = useMemo<Record<string, string>>(() => {
    return getResponseHeaders(span);
  }, [span]);

  const responseBody = useMemo<string>(() => {
    return getResponseBody(span) ?? "";
  }, [span]);

  const canHaveRequestBody = useMemo<boolean>(() => {
    const ucMethod = method.toUpperCase();
    return ucMethod !== "GET" && ucMethod !== "HEAD";
  }, [method]);

  const requestQueryParams = useMemo<Record<string, string> | null>(() => {
    return getRequestQueryParams(span);
  }, [span]);

  const statusCode = getStatusCode(span);

  return (
    <div id={id}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <SectionHeading className="max-lg:mt-2">
            Incoming Request
          </SectionHeading>

          <div className="flex gap-2">
            {statusCode && <Status statusCode={statusCode} />}
            <div className="inline-flex gap-2 font-mono py-1 px-2 text-xs bg-accent/80 rounded">
              <span className={cn(getHttpMethodTextColor(method))}>
                {method}
              </span>
              <span className="text-gray-400 font-light">{pathWithSearch}</span>
            </div>
            {matchedRoute && (
              <div className="flex gap-2 p-1 text-xs bg-accent/80 rounded">
                <span className="text-gray-200 text-xs">Route:</span>
                <span className="text-gray-400 font-mono inline-block text-xs">
                  {matchedRoute}
                </span>
              </div>
            )}
            <div className="inline-flex gap-2 font-mono text-gray-400 py-1 px-2 text-xs bg-accent/80 rounded">
              <ClockIcon className="w-4 h-4" />
              <span className="font-light">{duration}ms</span>
            </div>
          </div>
        </div>

        {requestQueryParams && (
          <SubSection>
            <CollapsibleKeyValueTableV2
              keyValue={requestQueryParams}
              title="Query Parameters"
            />
          </SubSection>
        )}

        <SubSection>
          <CollapsibleKeyValueTableV2
            keyValue={requestHeaders}
            title="Request Headers"
            className="max-w-full"
            sensitiveKeys={SENSITIVE_HEADERS}
          />
        </SubSection>

        {canHaveRequestBody && requestBody && (
          <>
            <Divider />
            <SubSection>
              <SubSectionHeading>Request Body</SubSectionHeading>
              <BodyViewerV2
                body={requestBody}
                contentType={requestHeaders["content-type"]}
                textMaxPreviewLines={15}
              />
            </SubSection>
          </>
        )}

        <Divider />

        <SubSection>
          <CollapsibleKeyValueTableV2
            keyValue={responseHeaders}
            title="Response Headers"
            sensitiveKeys={SENSITIVE_HEADERS}
          />
        </SubSection>

        {responseBody && (
          <>
            <Divider />
            <SubSection>
              <SubSectionHeading>Response Body</SubSectionHeading>
              <BodyViewerV2
                body={responseBody}
                contentType={responseHeaders["content-type"]}
                textMaxPreviewLines={15}
              />
            </SubSection>
          </>
        )}
      </div>
    </div>
  );
}
