import fs from "node:fs";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { serveStatic } from "@hono/node-server/serve-static";
import { createFactory } from "hono/factory";

// Shim __filename and __dirname since we're using esm
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * This list of possible paths is a temporary hack to make it easier to test running
 * this api with a *pre-built, and statically served* frontend in the following contexts:
 *   - npm run dev (locally)
 *   - npx locally or as a published pkg
 */
const POSSIBLE_FRONTEND_BUILD_PATHS = [
  /* For when we `npm run dev` from the api folder */
  path.resolve(__dirname, "..", "..", "frontend", "dist"),
  /* For when we run via `npx`
     **NOTE**
     This path assumes we are running from the `dist` folder in a compiled version of the api, 
     and that the frontend build has been copy pasted into the selfsame `dist` folder.
  */
  path.resolve(__dirname, "..", "..", "dist"),
];

const factory = createFactory();

export const staticServerMiddleware = serveStatic({
  // NOTE - Need to specify a relative path to assets for the frontend build
  root: getRelativePathToFrontendDist(),
  onNotFound(path, _c) {
    console.error("Not found", path);
  },
});

export const frontendRoutesHandler = factory.createHandlers((c) => {
  const frontendFolder = getPathToFrontendFolder();
  if (!frontendFolder) {
    return c.text("Frontend not found", 500);
  }
  const indexAbsolutePath = path.resolve(frontendFolder, "index.html");
  return c.html(fs.readFileSync(indexAbsolutePath, "utf-8"));
})[0];

/**
 * Helper function that tries to create a relative path to the ui build.
 * Falls back to just using the api's `dist` folder (if it can find it)
 *
 * NOTE - The path returned will be relative to the current working directory.
 *        https://discord.com/channels/1011308539819597844/1012485912409690122/1247001132648239114
 *
 */
function getRelativePathToFrontendDist() {
  const possiblePaths = POSSIBLE_FRONTEND_BUILD_PATHS;

  // Get the current working directory from which the script was executed
  // This is necessary for the `root` parameter of serveStatic
  const currentWorkingDir = process.cwd();

  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      console.debug("Found frontend folder!", possiblePath);

      const relativePathToFrontend = path.relative(
        currentWorkingDir,
        possiblePath,
      );

      console.debug("relativePathToFrontend", relativePathToFrontend);

      return relativePathToFrontend;
    }
  }

  console.error("Frontend build not found in the expected locations.");
}

/**
 * Helper function that checks if we can run pick up on any known locations
 * of the frontend build, in order to serve it.
 */
function getPathToFrontendFolder() {
  const possiblePaths = POSSIBLE_FRONTEND_BUILD_PATHS;

  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      return possiblePath;
    }
  }

  console.error("Frontend build not found in the expected locations.");
}
