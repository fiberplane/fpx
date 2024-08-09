import { useParams } from "react-router-dom";
import { EmptyState } from "./EmptyState";
import { RequestDetailsPageV2 } from "./RequestDetailsPageV2";
import { useEscapeToList } from "./hooks";

export function RequestDetailsPage() {
  const { traceId } = useParams<{ traceId: string }>();

  useEscapeToList();

  if (!traceId) {
    return <EmptyState />;
  }

  return <RequestDetailsPageV2 traceId={traceId} />;
}

export type TocItem = {
  id: string;
  title: string;
  status?: string | number;
  method?: string;
};
