import type { TraceDetailSpansResponse } from "@fiberplane/fpx-types";
import { useMutation } from "@tanstack/react-query";
import { api } from "../api";

export function useTraceSummary() {
  return useMutation({
    mutationFn: (data: { traceId: string; spans: TraceDetailSpansResponse }) =>
      api.getTraceSummary(data),
  });
}
