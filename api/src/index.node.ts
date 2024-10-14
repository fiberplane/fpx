import { createServer } from "node:http";
import { serve } from "@hono/node-server";
import { createClient } from "@libsql/client";
import chalk from "chalk";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/libsql";
import figlet from "figlet";
import type { WebSocket } from "ws";
import { createApp } from "./app.js";
import {
  DEFAULT_DATABASE_URL,
  FPX_PORT,
  USER_PROJECT_ROOT_DIR,
} from "./constants.js";
import * as schema from "./db/schema.js";
import { getAuthServer } from "./lib/auth/server.js";
import { getTSServer } from "./lib/expand-function/tsserver/index.js";
import { setupRealtimeService } from "./lib/realtime/index.js";
import { getSetting } from "./lib/settings/index.js";
import { resolveWebhoncUrl } from "./lib/utils.js";
import * as webhonc from "./lib/webhonc/index.js";
import logger from "./logger.js";
import { startRouteProbeWatcher } from "./probe-routes.js";
import {
  frontendRoutesHandler,
  staticServerMiddleware,
} from "./serve-frontend-build.js";

config({ path: ".dev.vars" });

// A couple of global in-memory only data structures:
// - wsConnections for realtime service
const wsConnections = new Set<WebSocket>();

const sql = createClient({
  url: process.env.FPX_DATABASE_URL ?? DEFAULT_DATABASE_URL,
});
const db = drizzle(sql, { schema });
// Set up the api routes
const app = createApp(db, webhonc, wsConnections);

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
const port = FPX_PORT;
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

// We need to kick off another server in the background on a predictable port
// TODO - Implement a flow that kicks off and tears down this server ephemerally
getAuthServer(FPX_PORT);

// First, fire off an async probe to the service we want to monitor
//   - This will collect information on all routes that the service exposes
//
// Additionally, this will watch for changes to files in the project directory,
//   - If a file changes, send a new probe to the service
startRouteProbeWatcher(USER_PROJECT_ROOT_DIR);

// Set up websocket server
setupRealtimeService({ server, path: "/ws", wsConnections });

// set up webhonc manager
webhonc.setupWebhonc({ host: resolveWebhoncUrl(), db, wsConnections });

// check settings if proxy requests is enabled
const proxyRequestsEnabled = await getSetting(db, "proxyRequestsEnabled");

if (proxyRequestsEnabled ?? false) {
  logger.debug("Proxy requests feature enabled.");
  await webhonc.start();
}

// check settings if ai is enabled, and proactively start the typescript language server
const aiEnabled = await getSetting(db, "aiEnabled");
if (aiEnabled ?? false) {
  logger.debug(
    "AI Request Generation enabled. Starting typescript language server",
  );
  try {
    await getTSServer(USER_PROJECT_ROOT_DIR);
  } catch (error) {
    logger.error("Error starting TSServer:", error);
  }
}
