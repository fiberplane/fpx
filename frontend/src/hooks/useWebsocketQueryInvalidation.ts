import { useRealtimeService } from "@/hooks/useRealtimeService";
import {
  WEBHONC_ID_KEY,
  WEBHONC_REQUEST_KEY,
} from "@/pages/WebhooksPage/types";
import { useQueryClient } from "@tanstack/react-query";

export function useWebsocketQueryInvalidation() {
  const queryClient = useQueryClient();

  const wsMessage = useRealtimeService();

  if (wsMessage) {
    if (wsMessage.event === "trace_created") {
      queryClient.invalidateQueries({ queryKey: wsMessage.payload });
    }

    switch (wsMessage.event) {
      case "trace_created": {
        queryClient.invalidateQueries({ queryKey: wsMessage.payload });
        break;
      }
      case "connection_open": {
        queryClient.invalidateQueries({ queryKey: [WEBHONC_ID_KEY] });
        break;
      }
      case "request_incoming": {
        queryClient.invalidateQueries({ queryKey: [WEBHONC_REQUEST_KEY] });
        break;
      }
      default: {
        console.warn(
          "Received websocket message that we cannot react to",
          wsMessage,
        );
      }
    }
  }
}
