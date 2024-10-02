import type { OtelSpan } from "@fiberplane/fpx-types";
import { IncomingRequestContent } from "./IncomingRequestContent";
import { IncomingRequestHeader } from "./IncomingRequestHeader";

type Props = {
  span: OtelSpan;
  isExpanded?: boolean;
};
export function IncomingRequest({ span, isExpanded = false }: Props) {
  return (
    <div>
      <IncomingRequestHeader attributes={span.attributes} />
      {isExpanded && <IncomingRequestContent attributes={span.attributes} />}
    </div>
  );
}
