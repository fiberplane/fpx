import { CodeMirrorSqlEditor } from "@/components/CodeMirrorEditor";
import { SubSection, SubSectionHeading } from "@/components/Timeline";
import { CollapsibleSubSection } from "@/components/Timeline/shared";
import { Status } from "@/components/ui/status";
import { SENSITIVE_HEADERS, cn, getHttpMethodTextColor, noop } from "@/utils";
import {
  getRequestBody,
  getRequestHeaders,
  getRequestMethod,
  getRequestUrl,
  getResponseBody,
  getResponseHeaders,
  getStatusCode,
} from "@/utils";
import {
  type NeonVendorInfo,
  type VendorInfo,
  isAnthropicVendorInfo,
  isNeonVendorInfo,
  isOpenAIVendorInfo,
} from "@/utils";
import type { OtelSpan } from "@fiberplane/fpx-types";
import { useMemo } from "react";
import { CollapsibleKeyValueTableV2 } from "../../KeyValueTableV2";
import { TextOrJsonViewer } from "../../TextJsonViewer";
import { useFormattedNeonQuery } from "./hooks";

type Props = { span: OtelSpan; vendorInfo: VendorInfo; isExpanded?: boolean };
export function FetchSpan({ span, vendorInfo, isExpanded = false }: Props) {
  const id = span.span_id;

  const method = getRequestMethod(span);

  const requestHeaders = useMemo<Record<string, string>>(() => {
    return getRequestHeaders(span);
  }, [span]);

  const requestBody = useMemo<string>(() => {
    return getRequestBody(span) ?? "";
  }, [span]);

  const responseHeaders = useMemo<Record<string, string>>(() => {
    return getResponseHeaders(span);
  }, [span]);

  const responseBody = useMemo<string>(() => {
    return getResponseBody(span) ?? "";
  }, [span]);

  const url = getRequestUrl(span);

  const { component } = useVendorSpecificSection(vendorInfo) ?? {};

  return (
    <GenericFetchSpan
      id={id}
      statusCode={getStatusCode(span)}
      method={method}
      url={url}
      requestHeaders={requestHeaders}
      requestBody={requestBody}
      responseHeaders={responseHeaders}
      responseBody={responseBody}
      isExpanded={isExpanded}
    >
      {component}
    </GenericFetchSpan>
  );
}

type GenericFetchSpanProps = {
  id: string;
  statusCode: number;
  method: string;
  url: string;
  requestHeaders: Record<string, string>;
  requestBody?: string;
  responseHeaders: Record<string, string>;
  responseBody?: string;
  children?: React.ReactNode;
  isExpanded?: boolean;
};

function GenericFetchSpan({
  id,
  statusCode,
  method,
  url,
  requestHeaders,
  requestBody,
  responseHeaders,
  responseBody,
  children,
  isExpanded,
}: GenericFetchSpanProps) {
  return (
    <div id={id}>
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 flex-wrap items-center">
            {statusCode !== undefined && <Status statusCode={statusCode} />}
            <div className="inline-flex gap-2 font-mono py-1 text-xs  px-2 bg-accent/80 rounded text-muted-foreground">
              <span className={cn("uppercase", getHttpMethodTextColor(method))}>
                {method}
              </span>
              {url}
            </div>
          </div>
        </div>

        {isExpanded && (
          <div
            onClick={event => event.stopPropagation()}
            onKeyDown={event => {
              if (event.key === "Enter") {
                event.stopPropagation();
              }
            }}
          >
            {children}

            <div className="px-2">
              <SubSectionHeading>Request</SubSectionHeading>
              <div>
                <SubSection>
                  <CollapsibleKeyValueTableV2
                    keyValue={requestHeaders}
                    title="Headers"
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const DEFAULT_VENDOR_RESULT = {
  component: undefined,
  title: undefined,
};

/**
 * Returns a component and title for a vendor-specific span.
 * @param span The span to render.
 * @returns A component and title for a vendor-specific section of the span.
 */
function useVendorSpecificSection(vendorInfo: VendorInfo) {
  return useMemo(() => {
    // const vendorInfo =
    if (isNeonVendorInfo(vendorInfo)) {
      return {
        component: <NeonSection vendorInfo={vendorInfo} />,
        title: "Neon Database Call",
      };
    }
    if (isOpenAIVendorInfo(vendorInfo)) {
      return {
        component: undefined,
        title: "OpenAI API Call",
      };
    }
    if (isAnthropicVendorInfo(vendorInfo)) {
      return {
        component: undefined,
        title: "Anthropic API Call",
      };
    }
    return DEFAULT_VENDOR_RESULT;
  }, [vendorInfo]);
}

function NeonSection({ vendorInfo }: { vendorInfo: NeonVendorInfo }) {
  const queryValue = useFormattedNeonQuery(vendorInfo?.sql);
  return (
    <SubSection>
      <SubSectionHeading>SQL Query</SubSectionHeading>
      <CodeMirrorSqlEditor value={queryValue} onChange={noop} readOnly={true} />
    </SubSection>
  );
}
