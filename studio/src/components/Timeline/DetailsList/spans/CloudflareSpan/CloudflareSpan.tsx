import { type CloudflareVendorInfo, isCloudflareD1VendorInfo } from "@/utils";
import type { OtelSpan } from "@fiberplane/fpx-types";
import { CloudflareAISpan } from "./CloudflareAISpan";
import { CloudflareD1Span } from "./CloudflareD1Span";
import { CloudflareKVSpan } from "./CloudflareKVSpan";
import { CloudflareR2Span } from "./CloudflareR2Span";

/**
 * Render information about a Span originating from a Cloudflare Binding
 */
export function CloudflareSpan({
  span,
  vendorInfo,
}: { span: OtelSpan; vendorInfo: CloudflareVendorInfo }) {
  if (isCloudflareD1VendorInfo(vendorInfo)) {
    return <CloudflareD1Span span={span} vendorInfo={vendorInfo} />;
  }
  if (vendorInfo.type === "r2") {
    return <CloudflareR2Span span={span} />;
  }
  if (vendorInfo.type === "ai") {
    return <CloudflareAISpan span={span} />;
  }
  if (vendorInfo.type === "kv") {
    return <CloudflareKVSpan span={span} />;
  }

  return null;
}
