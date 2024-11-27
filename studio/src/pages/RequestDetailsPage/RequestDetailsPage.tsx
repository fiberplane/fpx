import { useHandler } from "@fiberplane/hooks";
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

  const generateLinkToTrace = useHandler((traceId: string) => {
    return `/requests/${traceId}`;
  });

  return (
    <RequestDetailsPageV2
      traceId={traceId}
      generateLinkToTrace={generateLinkToTrace}
    />
  );
}

export type TocItem = {
  id: string;
  title: string;
  status?: string | number;
  method?: string;
};
