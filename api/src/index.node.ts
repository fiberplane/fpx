import { createServer } from "node:http";
import { serve } from "@hono/node-server";
import { createClient } from "@libsql/client";
import chalk from "chalk";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/libsql";
import figlet from "figlet";
import type { WebSocket } from "ws";
import { createApp } from "./app.js";
import { DEFAULT_DATABASE_URL } from "./constants.js";
import * as schema from "./db/schema/index.js";
import { setupRealtimeService } from "./lib/realtime/index.js";
import { connectToWebhonc } from "./lib/webhonc/index.js";
import logger from "./logger.js";
import { startRouteProbeWatcher } from "./probe-routes.js";
import {
  frontendRoutesHandler,
  staticServerMiddleware,
} from "./serve-frontend-build.js";
import { resolveWebhoncUrl } from "./lib/utils.js";

config({ path: ".dev.vars" });

// A couple of global in-memory only data structures:
// - wsConnections for realtime service
const wsConnections = new Set<WebSocket>();

const sql = createClient({
  url: process.env.FPX_DATABASE_URL ?? DEFAULT_DATABASE_URL,
});
const db = drizzle(sql, { schema });
// Set up the api routes
const app = createApp(db, wsConnections);

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
  const fpxLogo = chalk.greenBright(figlet.textSync("FPX Studio"));
  const runningMessage = "FPX Studio is up!";
  const localhostLink = chalk.blue(`http://localhost:${port}`);
  const visitMessage = `Visit ${localhostLink} to get started`;
  logger.info(`${fpxLogo}\n${runningMessage} ${visitMessage}\n`);
});

server.on("error", (err) => {
  if ("code" in err && err.code === "EADDRINUSE") {
    logger.error(
      `Port ${port} is already in use. Please choose a different port for FPX.`,
    );
    process.exit(1);
  } else {
    logger.error("Server error:", err);
  }
});

// First, fire off an async probe to the service we want to monitor
//   - This will collect information on all routes that the service exposes
//   - This powers a postman-like UI to ping routes and see responses
//
// Additionally, this will watch for changes to files in the project directory,
//   - If a file changes, send a new probe to the service
const watchDir = process.env.FPX_WATCH_DIR ?? process.cwd();
startRouteProbeWatcher(watchDir);

// Set up websocket server
setupRealtimeService({ server, path: "/ws", wsConnections });

const webhoncUrl = resolveWebhoncUrl();
connectToWebhonc(webhoncUrl, db, wsConnections);
