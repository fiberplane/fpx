// import {
//   getRequestBody,
//   getRequestHeaders,
//   getRequestMethod,
//   getRequestUrl,
//   getResponseBody,
//   getResponseHeaders,
//   getStatusCode,
// } from "@/utils";
import type { VendorInfo } from "@/utils";
import type { OtelSpan } from "@fiberplane/fpx-types";
import { FetchSpanContent } from "./FetchSpanContent";
// import { useVendorSpecificSection } from "./hooks";
import { FetchSpanHeader } from "./FetchSpanHeader";

type Props = { vendorInfo: VendorInfo; isExpanded?: boolean } & Pick<
  OtelSpan,
  "attributes"
>;
export function FetchSpan({
  attributes,
  vendorInfo,
  isExpanded = false,
}: Props) {
  // const { component: children } = useVendorSpecificSection(vendorInfo) ?? {};

  // const method = getRequestMethod({ attributes });
  // const requestHeaders = getRequestHeaders({ attributes });
  // const requestBody = getRequestBody({ attributes }) ?? "";
  // const responseHeaders = getResponseHeaders({ attributes });
  // const responseBody = getResponseBody({ attributes }) ?? "";
  // const url = getRequestUrl({ attributes });
  // const statusCode = getStatusCode({ attributes });

  return (
    <div className="flex flex-col gap-2 min-w-0">
      <FetchSpanHeader attributes={attributes} />
      {isExpanded && (
        <FetchSpanContent attributes={attributes} vendorInfo={vendorInfo} />
      )}
    </div>
  );
}
