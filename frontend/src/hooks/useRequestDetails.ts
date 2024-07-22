import { useMizuTraces } from "@/queries";

export function useRequestDetails(traceId?: string) {
  const { isPending, isError, data } = useMizuTraces();
  const trace = traceId ? data?.find((t) => t.id === traceId) : undefined;
  return {
    isPending,
    isError,
    trace,
  };
}
