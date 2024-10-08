import {
  CollapsibleSubSection,
  SubSection,
  SubSectionHeading,
} from "@/components/Timeline/shared";
import {
  SENSITIVE_HEADERS,
  type VendorInfo,
  getRequestBody,
  getRequestHeaders,
  getResponseBody,
  getResponseHeaders,
} from "@/utils";
import type { OtelSpan } from "@fiberplane/fpx-types";
import { CollapsibleKeyValueTableV2 } from "../../KeyValueTableV2/KeyValueTable";
import { TextOrJsonViewer } from "../../TextJsonViewer";
import { useVendorSpecificSection } from "./hooks";

type Props = { vendorInfo: VendorInfo } & Pick<OtelSpan, "attributes">;

export function FetchSpanContent(props: Props) {
  const { attributes, vendorInfo } = props;

  const { component: children } = useVendorSpecificSection(vendorInfo) ?? {};
  const requestHeaders = getRequestHeaders({ attributes });
  const requestBody = getRequestBody({ attributes }) ?? "";
  const responseHeaders = getResponseHeaders({ attributes });
  const responseBody = getResponseBody({ attributes }) ?? "";

  return (
    <div>
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
                <TextOrJsonViewer text={requestBody} textMaxPreviewLines={15} />
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
  );
}
