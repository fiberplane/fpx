import { createServer } from "node:http";
import { serve } from "@hono/node-server";
import { config } from "dotenv";
import { type WebSocket, WebSocketServer } from "ws";

import { createApp } from "./app.js";
import logger from "./logger.js";
import { probeRoutesWithExponentialBackoff } from "./probe-routes.js";
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

server.on("listening", () => {
  logger.info("FPX Studio is up and running!");
  logger.info(`Visit: http://localhost:${port}`);
});

server.on("error", (err) => {
  if ("code" in err && err.code === "EADDRINUSE") {
    console.error(
      `Port ${port} is already in use. Please choose a different port for FPX.`,
    );
    process.exit(1);
  } else {
    console.error("Server error:", err);
  }
});

// Fire off an async probe to the service we want to monitor
// This will collect information on all routes that the service exposes
// Which powers a postman-like UI to ping routes and see responses
const serviceTargetArgument = process.env.FPX_SERVICE_TARGET;
const probeMaxRetries = 10;
const probeDelay = 1000;
probeRoutesWithExponentialBackoff(
  serviceTargetArgument,
  probeMaxRetries,
  probeDelay,
);

const wss = new WebSocketServer({ server, path: "/ws" });
wss.on("connection", (ws) => {
  console.log("WebSocket connection established", ws.OPEN);
  wsConnections.add(ws);

  ws.on("ping", () => {
    console.log("ping");
    ws.send("pong");
  });
  ws.on("error", (err) => {
    if ("code" in err && err.code === "EADDRINUSE") {
      console.error(
        "WebSocket error: Address in use. Please choose a different port.",
      );
    } else {
      console.error("WebSocket error:", err);
    }
  });
  ws.on("close", (code) => {
    wsConnections.delete(ws);
    console.log("WebSocket connection closed", code);
  });
});
