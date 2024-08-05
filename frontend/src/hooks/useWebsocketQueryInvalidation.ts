import { useRealtimeService } from "@/hooks/useRealtimeService";
import { useQueryClient } from "@tanstack/react-query";

export function useWebsocketQueryInvalidation() {
  const queryClient = useQueryClient();

  const wsMessage = useRealtimeService();

  if (wsMessage) {
    switch (wsMessage.event) {
      case "trace_created": {
        console.log("trace_created");
        queryClient.invalidateQueries({ queryKey: wsMessage.payload });
        break;
      }

      case "connection_open": {
        // TODO: rewriting some webhook/websocket stuff tbd if this is needed
        console.log("connection_open");
        // queryClient.invalidateQueries({
        // queryKey: [WEBHONC_ID_KEY, WEBHONC_REQUEST_KEY],
        // });
        break;
      }

      case "request_incoming": {
        // TODO: rewriting some webhook/websocket stuff tbd if this is needed
        console.log("request_incoming");
        // queryClient.invalidateQueries({
        //   queryKey: [WEBHONC_REQUEST_KEY],
        //   refetchType: "all",
        // });
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
