import { MIZU_TRACES_KEY, PROBED_ROUTES_KEY } from "@/queries";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import z from "zod";

/**
 * Right now only one specific action!
 * This is an object describing which queries (react-queries)
 * to invalidate and rerun on the frontend.
 */
const FPXWebsocketMessageSchema = z.object({
  type: z.literal("invalidateQueries"),
  payload: z.array(z.enum([MIZU_TRACES_KEY, PROBED_ROUTES_KEY])),
});

type FPXWebsocketMessage = z.infer<typeof FPXWebsocketMessageSchema>;

const isFPXWebsocketMessage = (m: unknown): m is FPXWebsocketMessage =>
  FPXWebsocketMessageSchema.safeParse(m).success;

export function useWebsocketQueryInvalidation() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = new WebSocket("/ws");

    socket.onopen = () => {
      console.debug("Connected to websocket server");
    };

    socket.onmessage = (ev) => {
      console.debug("Received websocket message", ev?.data);
      let action: unknown;
      try {
        action = JSON.parse(ev?.data);
      } catch {
        // Silent - we log stuff below
      }
      const decodedAction =
        action && isFPXWebsocketMessage(action) ? action : null;
      if (!decodedAction) {
        console.warn(
          "Received websocket message that we cannot react to",
          action,
        );
        return;
      }
      queryClient.invalidateQueries({ queryKey: decodedAction.payload });
    };

    socket.onclose = (ev) => {
      console.debug("Disconnected from websocket server", ev);
    };

    socket.onerror = (error) => {
      console.error("Error with websocket server", error);
    };

    return () => {
      socket.close();
    };
  }, [queryClient]);
}
