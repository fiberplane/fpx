import { useParams } from "react-router-dom";
import { EmptyState } from "./EmptyState";
import { RequestDetailsPageV2 } from "./RequestDetailsPageV2";
import { useEscapeToList } from "./hooks";
import { useTraceContext } from "@/contexts";

export function RequestDetailsPage() {
  const { traceId: urlTraceId } = useParams<{ traceId: string }>();
  const { currentTraceId } = useTraceContext();

  const traceId = currentTraceId ?? urlTraceId;

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
