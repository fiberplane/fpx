import type { Server } from "node:http";
import { type WebSocket, WebSocketServer } from "ws";
import logger from "../../logger.js";

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
    logger.debug("ws connection established with the browser", ws.readyState === ws.OPEN);
    wsConnections.add(ws);

    ws.on("ping", () => {
      logger.debug("ping");
      ws.send("pong");
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
