import { useRequestorStore } from "@/pages/RequestorPage/store";
import { useParams } from "react-router-dom";

export function useActiveTraceId() {
  const { traceId = null } = useParams();
  const { activeHistoryResponseTraceId } = useRequestorStore(
    "activeHistoryResponseTraceId",
  );
  return traceId ?? activeHistoryResponseTraceId;
}
