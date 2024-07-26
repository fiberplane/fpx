import { useMizuTraces, useMizuTracesV2 } from "@/queries";

export function useRequestDetails(traceId?: string) {
  const { isPending, isError, data } = useMizuTraces();

  const queryV2 = useMizuTracesV2();
  const trace = traceId ? data?.find((t) => t.id === traceId) : undefined;
  // console.log('queryv2.data', queryV2.data)
  const traceV2 = traceId
    ? queryV2.data?.find((t) => t.id === traceId)
    : undefined;

  return {
    isPending,
    isError,
    trace,
    traceV2,
    traces: data,
  };
}
