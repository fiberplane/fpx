import path, { dirname } from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import { serveStatic } from '@hono/node-server/serve-static';
import { config } from "dotenv";
import { type WebSocket, WebSocketServer } from "ws";

import { createApp } from "./app.js";

config({ path: ".dev.vars" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const wsConnections = new Set<WebSocket>();
const app = createApp(wsConnections);

// NOTE - Need to specify a relative path to assets
const frontendPath = getRelativePathToFrontendDist();

/**
 * Serve the frontend static files
 */
app.use('/*', serveStatic({
  root: frontendPath, onNotFound(path, c) {
    console.error("Not found", path);
  },
}))

/**
 * Fallback route that just serves the frontend index.html file
 */
app.get("*", c => {
  const frontendFolder = getPathToFrontendFolder();
  if (!frontendFolder) {
    return c.text("Frontend not found", 500);
  }
  const indexAbsolutePath = path.resolve(frontendFolder, "index.html")
  return c.html(fs.readFileSync(indexAbsolutePath, 'utf-8'));
})

const port = +(process.env.MIZU_PORT ?? 8788);
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

/**
 * Helper function that tries to create a relative path to  the `frontend` folder's dist, 
 * then falls back to just using the api's `dist` folder
 * 
 * NOTE - The path returned will be relative to the current working directory.
 *        https://discord.com/channels/1011308539819597844/1012485912409690122/1247001132648239114
 *
 * 
 * This is a temporary hack to make it easier to test running mizu with a frontend in the following contexts:
 * - npm run dev (locally)
 * - npx locally 
 * - npx as a published pkg
 */
function getRelativePathToFrontendDist() {
  const possiblePaths = [
    path.resolve(__dirname, '..', 'frontend', 'dist'),
    path.resolve(__dirname, '..', '..', 'frontend', 'dist'),
    path.resolve(__dirname, '..', '..', '..', 'frontend', 'dist'),
    path.resolve(__dirname, '..', '..', 'dist'), // HACK - support serving copy-pasted frontend build
  ];

  // Get the current working directory from which the script was executed
  // This is necessary for the `root` parameter of serveStatic
  // https://discord.com/channels/1011308539819597844/1012485912409690122/1247001132648239114
  const currentWorkingDir = process.cwd();

  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      console.log("Found frontend folder!", possiblePath)

      // NOTE - `serveStatic` only accepts a relative path :scream:
      const relativePathToFrontend = path.relative(currentWorkingDir, possiblePath);

      console.log('relativePathToFrontend', relativePathToFrontend);

      return relativePathToFrontend;
    }
  }

  console.error('Frontend dist folder not found in the expected locations.');
};

/**
 * Helper function that searches for the `frontend` folder's dist, 
 * then falls back to just using the current folder, if we're in the api's `dist`
 * 
 * This is a temporary hack to make it easier to test running mizu with a frontend in the following contexts:
 * - npm run dev (locally)
 * - npx locally 
 * - npx as a published pkg
 */
function getPathToFrontendFolder() {
  const possiblePaths = [
    path.resolve(__dirname, '..', 'frontend', 'dist'),
    path.resolve(__dirname, '..', '..', 'frontend', 'dist'),
    path.resolve(__dirname, '..', '..', '..', 'frontend', 'dist'),
    path.resolve(__dirname, '..', '..', 'dist'), // HACK - support serving copy-pasted frontend build
  ];

  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      return possiblePath;
    }
  }

  console.error('Frontend dist folder not found in the expected locations, falling back to current directory.');
};
