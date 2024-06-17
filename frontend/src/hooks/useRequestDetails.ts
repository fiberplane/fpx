import { useMizuTraces } from "@/queries";
import { isError } from "react-query";

export function useRequestDetails(traceId?: string) {
  const query = useMizuTraces();
  const trace = traceId ? query.data?.find((t) => t.id === traceId) : undefined;
  return {
    isLoading: query.isLoading,
    isError: isError(query),
    trace,
  };
}
