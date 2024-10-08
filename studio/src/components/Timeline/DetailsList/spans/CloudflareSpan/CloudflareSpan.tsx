import { type CloudflareVendorInfo, isCloudflareD1VendorInfo } from "@/utils";
import type { OtelSpan } from "@fiberplane/fpx-types";
import { CloudflareAISpan } from "./CloudflareAISpan";
import { CloudflareD1Span } from "./CloudflareD1Span";
import { CloudflareKVSpan } from "./CloudflareKVSpan";
import { CloudflareR2Span } from "./CloudflareR2Span";

type Props = { vendorInfo: CloudflareVendorInfo } & Pick<
  OtelSpan,
  "attributes"
>;
/**
 * Render information about a Span originating from a Cloudflare Binding
 */
export function CloudflareSpan({ attributes, vendorInfo }: Props) {
  if (isCloudflareD1VendorInfo(vendorInfo)) {
    return <CloudflareD1Span attributes={attributes} vendorInfo={vendorInfo} />;
  }
  if (vendorInfo.type === "r2") {
    return <CloudflareR2Span attributes={attributes} />;
  }
  if (vendorInfo.type === "ai") {
    return <CloudflareAISpan attributes={attributes} />;
  }
  if (vendorInfo.type === "kv") {
    return <CloudflareKVSpan attributes={attributes} />;
  }

  return null;
}
