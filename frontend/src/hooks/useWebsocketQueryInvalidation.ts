import { MIZU_TRACES_KEY, PROBED_ROUTES_KEY } from "@/queries";
import { useHandler } from "@fiberplane/hooks";
import { useQueryClient } from "@tanstack/react-query";
import z from "zod";
import { useWebSocket } from "./useWebSocket"

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
  const onmessage = useHandler((ev: MessageEvent) => {
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
  })

  useWebSocket("/ws", onmessage);
}
