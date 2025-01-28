import { SectionHeading } from "@/components/Timeline/shared";
import { getCloudflareSpanName } from "@/components/Timeline/utils";
import { type VendorInfo, isCloudflareVendorInfo } from "@/utils";
import type { OtelSpan } from "@fiberplane/fpx-types";

type Props = {
  /**
   * Vendor information is used to override the span name
   */
  vendorInfo: VendorInfo;
} & Pick<OtelSpan, "attributes" | "name">;

export function GenericSpanHeader(props: Props) {
  const { attributes, vendorInfo, name: defaultName } = props;
  const isCfSpan = isCloudflareVendorInfo(vendorInfo);
  const name = isCfSpan
    ? getCloudflareSpanName({ attributes }, vendorInfo)
    : defaultName;

  return (
    <SectionHeading className="grid gap-2 grid-cols-[1fr] items-center min-h-[26px]">
      <div className="flex items-center gap-2 max-w-full text-muted-foreground">
        {name}
      </div>
    </SectionHeading>
  );
}
