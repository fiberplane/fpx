import { useHandler } from "@fiberplane/hooks";
import { useWebSocket } from "./useWebSocket";

export const useTracesSocket = () => {
  const onmessage = useHandler((ev: MessageEvent) => {
    console.debug("Received websocket message", ev?.data);
    // let action: unknown;
    // try {
    //   action = JSON.parse(ev?.data);
    // } catch {
    //   // Silent - we log stuff below
    // }

    // const decodedAction =
    //   action && isFPXWebsocketMessage(action) ? action : null;
    // if (!decodedAction) {
    //   console.warn(
    //     "Received websocket message that we cannot react to",
    //     action,
    //   );
    //   return;
    // }
    // queryClient.invalidateQueries({ queryKey: decodedAction.payload });
  });
  useWebSocket("/api/ws", onmessage);
}
