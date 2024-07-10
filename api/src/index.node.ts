import { createServer } from "node:http";
import { serve } from "@hono/node-server";
import { config } from "dotenv";
import { type WebSocket, WebSocketServer } from "ws";
import { createApp } from "./app.js";
import { startRouteProbeWatcher } from "./probe-routes.js";
import {
  frontendRoutesHandler,
  staticServerMiddleware,
} from "./serve-frontend-build.js";

config({ path: ".dev.vars" });

const wsConnections = new Set<WebSocket>();

// Set up the api routes
const app = createApp(wsConnections);

/**
 * Serve all the frontend static files
 */
app.use("/*", staticServerMiddleware);

/**
 * Fallback route that just serves the frontend index.html file,
 * This is necessary to support frontend routing!
 */
app.get("*", frontendRoutesHandler);

// Serve the API
const port = +(process.env.FPX_PORT ?? 8788);
const server = serve({
  fetch: app.fetch,
  port,
  createServer,
}) as ReturnType<typeof createServer>;

console.log(`FPX Server is running: http://localhost:${port}`);

// First, fire off an async probe to the service we want to monitor
//   - This will collect information on all routes that the service exposes
//   - This powers a postman-like UI to ping routes and see responses
//
// Additionally, this will watch for changes to files in the project directory,
//   - If a file changes, send a new probe to the service
const watchDir = process.env.FPX_WATCH_DIR ?? process.cwd();
startRouteProbeWatcher(watchDir);

// Set up websocket server
const wss = new WebSocketServer({ server, path: "/ws" });
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
