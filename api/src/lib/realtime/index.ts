import type { Server } from "node:http";
import { type WebSocket, WebSocketServer } from "ws";
import logger from "../../logger/index.js";

interface RealtimeServiceOptions {
  server: Server;
  path: string;
  wsConnections: Set<WebSocket>;
}
export function setupRealtimeService({
  server,
  path,
  wsConnections,
}: RealtimeServiceOptions): void {
  const wss = new WebSocketServer({ server, path });

  wss.on("connection", (ws) => {
    logger.debug(
      "ws connection established with the browser",
      ws.readyState === ws.OPEN,
    );
    wsConnections.add(ws);

    // NOTE - The `react-use-websocket` library's ping message was not getting picked up as an actual ping frame here,
    //        so below, we use `ws.on("message", (data) => { ... })` to detect the ping message and send a pong back instead.
    // ws.on("ping", () => {
    //   logger.debug("ping");
    //   // ws.send("pong");
    //   ws.pong();
    // });
    ws.on("message", (data) => {
      const message = data.toString();
      if (message === "ping") {
        logger.debug("Received ping from websocket client");
        ws.send("pong");
      }
    });

    ws.on("error", (err) => {
      if ("code" in err && err.code === "EADDRINUSE") {
        logger.error(
          "WebSocket error: Address in use. Please choose a different port.",
        );
      } else {
        logger.error("WebSocket error:", err);
      }
    });

    ws.on("close", (code) => {
      wsConnections.delete(ws);
      logger.debug("WebSocket connection closed", code);
    });
  });
}
