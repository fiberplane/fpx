/**
 * UNUSED
 *
 * The makings of a module to share a websocket connection across the app.
 */

import { useContext } from "react";
import { WebSocketContext } from "./WebSocketContext";

export const useFpxWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error(
      "useFpxWebSocket must be used within a WebSocketContextProvider",
    );
  }
  return context;
};
