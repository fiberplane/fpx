import { serve } from "@hono/node-server";
import { config } from "dotenv";

import { type WebSocket, WebSocketServer } from "ws";
import { createApp } from "./app";

config({ path: ".dev.vars" });

const wsConnections = new Set<WebSocket>();
const app = createApp(wsConnections);

// health check
app.get("/", async (c) => {
  return c.text("Hello Node.js Hono");
});

const port = 8788;
const server = serve({
  fetch: app.fetch,
  port,
});
console.log(`Server is running: http://localhost:${port}`);

const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("WebSocket connection established", ws.OPEN);
  wsConnections.add(ws);

  ws.on("ping", () => {
    console.log("ping");
    ws.send("pong");
  });
  ws.on("error", console.error);
  ws.on("close", (code) => {
    wsConnections.delete(ws);
    console.log("WebSocket connection closed", code);
  });
});
