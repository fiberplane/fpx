import { useMizuTraces, useMizuTracesV2 } from "@/queries";
import { useEffect } from "react";

export function useRequestDetails(traceId?: string) {
  const { isPending, isError, data } = useMizuTraces();

  const queryV2 = useMizuTracesV2();
  const trace = traceId ? data?.find((t) => t.id === traceId) : undefined;
  const traceV2 = traceId
    ? queryV2.data?.find((t) => t.id === traceId)
    : undefined;
  useEffect(() => {
    if (traceV2) {
      console.log("traceV2", traceV2);
    }
  }, [traceV2]);
  return {
    isPending,
    isError,
    trace,
    traceV2,
  };
}
