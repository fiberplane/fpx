import fs from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { serve } from "@hono/node-server";
import { config } from "dotenv";
import { minimatch } from "minimatch";
import { type WebSocket, WebSocketServer } from "ws";
import { createApp } from "./app.js";
import { getIgnoredPaths } from "./lib/utils.js";
import { debouncedProbeRoutesWithExponentialBackoff } from "./probe-routes.js";
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

// Fire off an async probe to the service we want to monitor
// This will collect information on all routes that the service exposes
// Which powers a postman-like UI to ping routes and see responses
const serviceTargetArgument = process.env.FPX_SERVICE_TARGET;
const probeMaxRetries = 10;
const probeDelay = 1000;
const watchDir = process.env.FPX_WATCH_DIR ?? process.cwd();

const ignoredPaths = getIgnoredPaths();

debouncedProbeRoutesWithExponentialBackoff(
  serviceTargetArgument,
  probeMaxRetries,
  probeDelay,
);

fs.watch(watchDir, { recursive: true }, async (eventType, filename) => {
  if (!filename) {
    return;
  }
  if (ignoredPaths.includes(filename)) {
    return;
  }
  // E.g., ignore everything inside the `.wrangler` directory
  if (
    ignoredPaths.some((pattern) => filename.startsWith(`${pattern}${path.sep}`))
  ) {
    return;
  }
  // E.g., ignore all files with the given name (e.g., `fpx.db`, `fpx.db-journal`)
  if (ignoredPaths.some((pattern) => path.basename(filename) === pattern)) {
    return;
  }
  // Use minimatch to see if the filename matches any of the ignored patterns
  // This is because gitignore can have glob patterns, etc
  if (ignoredPaths.some((pattern) => minimatch(filename, pattern))) {
    return;
  }

  console.debug(`File ${filename} ${eventType}, sending a new probe`);

  debouncedProbeRoutesWithExponentialBackoff(
    serviceTargetArgument,
    probeMaxRetries,
    probeDelay,
  );
});

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
