import { Status } from "@/components/ui/status";
import { CodeMirrorSqlEditor } from "@/pages/RequestorPage/Editors/CodeMirrorEditor";
import { getHttpMethodTextColor } from "@/pages/RequestorPage/method";
import { MizuFetchSpan, MizuSpan } from "@/queries/traces-v2";
import { cn, noop } from "@/utils";
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
import { isNeonSpan, isVendorifiedSpan } from "./vendorify-traces";

function getRequestUrl(span: MizuSpan) {
  return `${span.attributes["url.full"]}`;
}

export function FetchSpan({ span }: { span: MizuFetchSpan }) {
  const id = timelineId(span);

  const method = getMethod(span);

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

  const duration = useMemo(() => {
    try {
      const duration =
        new Date(span.end_time).getTime() - new Date(span.start_time).getTime();
      return duration;
    } catch (e) {
      return null;
    }
  }, [span]);

  const url = getRequestUrl(span);

  const { component, title } = useVendorSpecificSection(span) ?? {};

  return (
    <GenericFetchSpan
      id={id}
      title={title}
      statusCode={getStatusCode(span)}
      duration={duration}
      method={method}
      url={url}
      requestHeaders={requestHeaders}
      requestBody={requestBody}
      responseHeaders={responseHeaders}
      responseBody={responseBody}
    >
      {component}
    </GenericFetchSpan>
  );
}

type GenericFetchSpanProps = {
  id: string;
  title?: string;
  statusCode: number;
  duration: number | null;
  method: string;
  url: string;
  requestHeaders: Record<string, string>;
  requestBody?: string;
  responseHeaders: Record<string, string>;
  responseBody?: string;
  children?: React.ReactNode;
};

function GenericFetchSpan({
  id,
  title,
  statusCode,
  duration,
  method,
  url,
  requestHeaders,
  requestBody,
  responseHeaders,
  responseBody,
  children,
}: GenericFetchSpanProps) {
  return (
    <div id={id}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 my-4">
          <SectionHeading>{title || "Fetch"}</SectionHeading>
          <div className="flex gap-2">
            <div className="inline-flex gap-2 font-mono py-1 px-2 text-xs bg-accent/80 rounded">
              <span className={cn("uppercase", getHttpMethodTextColor(method))}>
                {method}
              </span>
              {url}
            </div>
            <div className="inline-flex gap-2 font-mono text-gray-400 py-1 px-2 text-xs bg-accent/80 rounded">
              <ClockIcon className="w-4 h-4" />
              <span className=" font-light">{duration}ms</span>
            </div>
            <Status statusCode={statusCode} />
          </div>
        </div>

        {children}

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

const DEFAULT_VENDOR_RESULT = {
  component: undefined,
  title: undefined,
};

function useVendorSpecificSection(span: MizuSpan) {
  return useMemo(() => {
    if (!isVendorifiedSpan(span)) {
      return DEFAULT_VENDOR_RESULT;
    }
    if (isNeonSpan(span)) {
      return {
        component: (
          <SubSection>
            <SubSectionHeading>SQL Query</SubSectionHeading>
            <CodeMirrorSqlEditor
              value={span.vendorInfo.sql}
              onChange={noop}
              readOnly={true}
            />
          </SubSection>
        ),
        title: "Neon Database Call",
      };
    }
    return DEFAULT_VENDOR_RESULT;
  }, [span]);
}
