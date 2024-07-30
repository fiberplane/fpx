import { useTracingLiteEnabled } from "@/hooks";
import { useParams } from "react-router-dom";
import { EmptyState } from "./EmptyState";
import { RequestDetailsPageV1 } from "./RequestDetailsPageV1";
import { RequestDetailsPageV2 } from "./RequestDetailsPageV2";
import { useEscapeToList } from "./hooks";

export function RequestDetailsPage(props: { otel?: boolean }) {
  const { otel = false } = props;
  const { traceId } = useParams<{ traceId: string }>();

  useEscapeToList();
  const shouldRenderV2 = useTracingLiteEnabled() || otel;

  if (!traceId) {
    return <EmptyState />;
  }

  if (shouldRenderV2) {
    return <RequestDetailsPageV2 traceId={traceId} otel={otel} />;
  }

  return <RequestDetailsPageV1 traceId={traceId} />;
}

export type TocItem = {
  id: string;
  title: string;
  status?: string | number;
  method?: string;
};
