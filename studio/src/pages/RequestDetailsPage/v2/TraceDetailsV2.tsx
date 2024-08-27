// import { Badge } from "@/components/ui/badge";
// import { SpanStatus } from "@/constants";
// import { type OtelSpan, isMizuOrphanLog } from "@/queries";
// import {
//   type VendorInfo,
//   type Waterfall,
//   getNumber,
//   getString,
//   isFetchSpan,
//   isIncomingRequestSpan,
// } from "@/utils";
// import { useMemo } from "react";
// import { StackTrace } from "../StackTrace";
// import { SectionHeading } from "../shared";
// import { FetchSpan } from "./FetchSpan";
// import { IncomingRequest } from "./IncomingRequest";
// import { KeyValueTableV2 } from "./KeyValueTableV2";
// import { OrphanLog } from "./OrphanLog";
// import { SubSection, SubSectionHeading } from "./shared";

// function SpanDetails({
//   span,
//   vendorInfo,
// }: { span: OtelSpan; vendorInfo: VendorInfo }) {
//   if (isIncomingRequestSpan(span)) {
//     return <IncomingRequest span={span} />;
//   }

//   if (isFetchSpan(span)) {
//     return <FetchSpan span={span} vendorInfo={vendorInfo} />;
//   }

//   return <GenericSpan span={span} />;
// }
