import { Status } from "@/components/ui/status";
import { getHttpMethodTextColor } from "@/pages/RequestorPage/method";
import { MizuRootRequestSpan } from "@/queries/traces-v2";
import { cn } from "@/utils";
import { ClockIcon } from "@radix-ui/react-icons";
import { useMemo } from "react";
import { TextOrJsonViewer } from "../TextJsonViewer";
import { SectionHeading } from "../shared";
import { KeyValueTableV2 } from "./KeyValueTableV2";
import { getRequestHeaders, getResponseHeaders } from "./otel-helpers";
import { SubSection, SubSectionHeading } from "./shared";
import { timelineId } from "./timelineId";

function getMethod(span: MizuRootRequestSpan) {
  return `${span.attributes["http.request.method"]}`;
}

function getStatusCode(span: MizuRootRequestSpan) {
  return parseInt(`${span.attributes["http.response.status_code"]}`);
}

function getMatchedRoute(span: MizuRootRequestSpan) {
  return `${span.attributes["http.route"]}`;
}

function getRequestBody(span: MizuRootRequestSpan) {
  return `${span.attributes["fpx.request.body"]}`;
}

function getResponseBody(span: MizuRootRequestSpan) {
  return `${span.attributes["fpx.response.body"]}`;
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

  const requestHeaders = useMemo<Record<string, string>>(() => {
    return getRequestHeaders(span);
  }, [span]);

  const requestBody = useMemo<string>(() => {
    return getRequestBody(span);
  }, [span]);

  const responseHeaders = useMemo<Record<string, string>>(() => {
    return getResponseHeaders(span);
  }, [span]);

  const responseBody = useMemo<string>(() => {
    return getResponseBody(span);
  }, [span]);

  return (
    <div id={id}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 my-4">
          <SectionHeading>Incoming Request</SectionHeading>
          <div className="flex gap-2">
            <div className="inline-flex gap-2 font-mono py-1 px-2 text-xs bg-accent/80 rounded">
              <span className={cn(getHttpMethodTextColor(method))}>
                {method}
              </span>
              <span className="text-gray-400 font-light">{matchedRoute}</span>
            </div>
            <div className="inline-flex gap-2 font-mono text-gray-400 py-1 px-2 text-xs bg-accent/80 rounded">
              <ClockIcon className="w-4 h-4" />
              <span className=" font-light">{duration}ms</span>
            </div>
            <Status statusCode={getStatusCode(span)} />
          </div>
        </div>

        <SubSection>
          <SubSectionHeading>Request Headers</SubSectionHeading>
          <KeyValueTableV2 keyValue={requestHeaders} />
        </SubSection>

        {requestBody && (
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
          <SubSectionHeading>Response Headers</SubSectionHeading>
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

const Divider = () => {
  return <div className="h-[1px] w-full bg-muted/80" />;
};
