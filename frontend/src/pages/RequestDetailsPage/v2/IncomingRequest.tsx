import { Status } from "@/components/ui/status";
import { getHttpMethodTextColor } from "@/pages/RequestorPage/method";
import { MizuRootRequestSpan } from "@/queries/traces-v2";
import { cn } from "@/utils";
import { ClockIcon } from "@radix-ui/react-icons";
import { useMemo } from "react";
import { TextOrJsonViewer } from "../TextJsonViewer";
import { SectionHeading } from "../shared";
import { KeyValueTableV2 } from "./KeyValueTableV2";
import {
  getMethod,
  getRequestBody,
  getRequestHeaders,
  getResponseBody,
  getResponseHeaders,
  getStatusCode,
} from "./otel-helpers";
import { Divider, SubSection, SubSectionHeading } from "./shared";
import { timelineId } from "./timelineId";

function getMatchedRoute(span: MizuRootRequestSpan) {
  return `${span.attributes["http.route"]}`;
}

function getPathWithSearch(span: MizuRootRequestSpan) {
  const path = span.attributes["url.path"];
  const queryParams = span.attributes["url.query"];
  const queryParamsString = queryParams ? `?${queryParams}` : "";
  return `${path}${queryParamsString}`;
}

export function IncomingRequest({ span }: { span: MizuRootRequestSpan }) {
  const id = timelineId(span);
  const method = getMethod(span);
  const matchedRoute = getMatchedRoute(span);
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
    return getPathWithSearch(span);
  }, [span]);

  const requestHeaders = useMemo<Record<string, string>>(() => {
    return getRequestHeaders(span);
  }, [span]);

  const requestHeadersCount = useMemo<number>(() => {
    return Object.keys(requestHeaders).length;
  }, [requestHeaders]);

  const requestBody = useMemo<string>(() => {
    return getRequestBody(span);
  }, [span]);

  const responseHeaders = useMemo<Record<string, string>>(() => {
    return getResponseHeaders(span);
  }, [span]);

  const responseHeadersCount = useMemo<number>(() => {
    return Object.keys(responseHeaders).length;
  }, [responseHeaders]);

  const responseBody = useMemo<string>(() => {
    return getResponseBody(span);
  }, [span]);

  const canHaveRequestBody = useMemo<boolean>(() => {
    const ucMethod = method.toUpperCase();
    return ucMethod !== "GET" && ucMethod !== "HEAD";
  }, [method]);

  return (
    <div id={id}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 my-4">
          <SectionHeading>
            Incoming Request{" "}
            {/* <span className="text-gray-400 font-mono text-sm italic inline-block ml-2">
              {matchedRoute}
            </span> */}
          </SectionHeading>

          <div className="flex gap-2">
            <div className="inline-flex gap-2 font-mono py-1 px-2 text-xs bg-accent/80 rounded">
              <span className={cn(getHttpMethodTextColor(method))}>
                {method}
              </span>
              <span className="text-gray-400 font-light">{pathWithSearch}</span>
            </div>
            <div className="inline-flex gap-2 font-mono text-gray-400 py-1 px-2 text-xs bg-accent/80 rounded">
              <ClockIcon className="w-4 h-4" />
              <span className="font-light">{duration}ms</span>
            </div>
            <Status statusCode={getStatusCode(span)} />
          </div>
        </div>

        <SubSection>
          <SubSectionHeading>
            Request Headers <CountBadge count={requestHeadersCount} />
          </SubSectionHeading>
          <KeyValueTableV2 keyValue={requestHeaders} />
        </SubSection>

        {canHaveRequestBody && requestBody && (
          <>
            <Divider />
            <SubSection>
              <SubSectionHeading>Request Body</SubSectionHeading>
              <TextOrJsonViewer text={requestBody} />
            </SubSection>
          </>
        )}

        <Divider />

        <SubSection>
          <SubSectionHeading>
            Response Headers <CountBadge count={responseHeadersCount} />
          </SubSectionHeading>
          <KeyValueTableV2 keyValue={responseHeaders} />
        </SubSection>

        {responseBody && (
          <>
            <Divider />
            <SubSection>
              <SubSectionHeading>Response Body</SubSectionHeading>
              <TextOrJsonViewer text={responseBody} />
            </SubSection>
          </>
        )}
      </div>
    </div>
  );
}

const CountBadge = ({ count }: { count: number }) => {
  return (
    <span className="text-gray-400 font-normal bg-muted-foreground/20 rounded px-1.5 inline-block ml-2">
      {count}
    </span>
  );
};
