import type { ApiResponse } from "@/types";
import type { TraceDetailSpansResponse } from "@fiberplane/fpx-types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";

export function useTraceSummary() {
  const queryClient = useQueryClient();
  const queryKey = ["trace-summary"];

  return useMutation({
    mutationFn: (data: {
      traceId: string;
      spans: TraceDetailSpansResponse;
    }): Promise<ApiResponse<{ summary: string }>> => api.getTraceSummary(data),
    retry: false,
    gcTime: 1000 * 60 * 5, // Cache for 5 minutes
    onSuccess: (data, variables) => {
      // Cache the successful response with a key that includes the traceId
      queryClient.setQueryData([...queryKey, variables.traceId], data);
    },
  });
}
