import { useQueryClient } from "@tanstack/react-query";
import { useRealtimeService } from "@/hooks/useRealtimeService";

export function useWebsocketQueryInvalidation() {
  const queryClient = useQueryClient();

  const wsMessage = useRealtimeService();

  if (wsMessage) {
    if ( wsMessage.event === "trace_created") {
      queryClient.invalidateQueries({ queryKey: wsMessage.payload });
    }
    console.warn("Received websocket message that we cannot react to", wsMessage);
  }
}
