import { useParams } from "react-router-dom";
import { EmptyState } from "./EmptyState";
import { RequestDetailsPageV2 } from "./RequestDetailsPageV2";
import { useEscapeToList } from "./hooks";

export function RequestDetailsPage(props: { otel?: boolean }) {
  const { otel = false } = props;
  const { traceId } = useParams<{ traceId: string }>();

  useEscapeToList();

  if (!traceId) {
    return <EmptyState />;
  }

  return <RequestDetailsPageV2 traceId={traceId} otel={otel} />;
}

export type TocItem = {
  id: string;
  title: string;
  status?: string | number;
  method?: string;
};
