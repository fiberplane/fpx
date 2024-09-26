// import { CollapsibleKeyValueTableV2 } from "../KeyValueTableV2";
// import { TextOrJsonViewer } from "../TextJsonViewer";
import { StatusCode } from "@/pages/RequestorPage/RequestorHistory";
import {
  // SENSITIVE_HEADERS,
  cn,
  getHttpMethodTextColor,
  // getRequestBody,
  // getRequestEnv,
  // getRequestHeaders,
  // getResponseBody,
  // getResponseHeaders,
  getStatusCode,
  // isSensitiveEnvVar,
} from "@/utils";
import { getMatchedRoute, getRequestMethod, getRequestUrl } from "@/utils";
import type { OtelSpan } from "@fiberplane/fpx-types";
import { useMemo } from "react";
// import { useTimelineIcon } from "../../hooks";
import {
  // CollapsibleSubSection,
  SectionHeading,
  // SubSection,
  // SubSectionHeading,
} from "../../shared";

export function IncomingRequest({ span }: { span: OtelSpan }) {
  const id = span.span_id;
  const method = getRequestMethod(span);

  const pathWithSearch = useMemo<string>(() => {
    return getRequestUrl(span);
  }, [span]);

  const matchedRoute = useMemo<string>(() => {
    return getMatchedRoute(span);
  }, [span]);

  // const requestHeaders = useMemo<Record<string, string>>(() => {
  //   return getRequestHeaders(span);
  // }, [span]);

  // const requestBody = useMemo<string>(() => {
  //   return getRequestBody(span) ?? "";
  // }, [span]);

  // const responseHeaders = useMemo<Record<string, string>>(() => {
  //   return getResponseHeaders(span);
  // }, [span]);

  // const responseBody = useMemo<string>(() => {
  //   return getResponseBody(span) ?? "";
  // }, [span]);

  const responseStatusCode = useMemo(() => {
    return getStatusCode(span);
  }, [span]);

  // const icon = useTimelineIcon(span);
  // const requestEnv = getRequestEnv(span);

  return (
    <div id={id}>
      {/* <div className="flex flex-col gap-2"> */}
      <div className="flex flex-col gap-2">
        <SectionHeading className="flex items-center gap-2 max-lg:mt-2">
          {/* {icon}
            Incoming Request */}
          <StatusCode
            status={responseStatusCode}
            isFailure={false}
            className="text-xs"
          />

          <div className="inline-flex gap-2 font-mono py-1 text-xs bg-accent/80 rounded px-1">
            <span className={cn(getHttpMethodTextColor(method))}>{method}</span>
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
        </SectionHeading>

        {/* <div className="flex gap-2">
            <div className="inline-flex gap-2 font-mono py-1 text-xs bg-accent/80 rounded px-1">
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
          </div> */}
      </div>

      {/* <div className="px-2">
          <SubSectionHeading>Request</SubSectionHeading>
          <div className="">
            <CollapsibleKeyValueTableV2
              title="Environment Vars"
              keyValue={requestEnv}
              defaultCollapsed
              sensitiveKeys={isSensitiveEnvVar}
              emptyMessage="No environment vars found"
              keyCellClassName="w-[96px] lg:w-[96px] lg:min-w-[96px]"
            />
            <SubSection>
              <CollapsibleKeyValueTableV2
                keyValue={requestHeaders}
                title=" Headers"
                sensitiveKeys={SENSITIVE_HEADERS}
              />
            </SubSection>

            {requestBody && (
              <>
                <CollapsibleSubSection heading="Request Body">
                  <TextOrJsonViewer
                    text={requestBody}
                    textMaxPreviewLines={15}
                  />
                </CollapsibleSubSection>
              </>
            )}
          </div>
        </div>

        <div className="px-2">
          <SubSectionHeading>Response</SubSectionHeading>
          <div>
            <SubSection>
              <CollapsibleKeyValueTableV2
                keyValue={responseHeaders}
                title="Headers"
                sensitiveKeys={SENSITIVE_HEADERS}
              />
            </SubSection>

            {responseBody && (
              <>
                <CollapsibleSubSection heading="Body">
                  <TextOrJsonViewer
                    text={responseBody}
                    textMaxPreviewLines={15}
                  />
                </CollapsibleSubSection>
              </>
            )}
          </div>
        </div> */}
      {/* </div> */}
    </div>
  );
}
