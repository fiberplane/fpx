/** @jsx jsx */
/** @jsxImportSource hono/jsx */
// @ts-nocheck
import { jsx } from "hono/jsx";

import { existsSync, readFileSync } from "node:fs";
import path, { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { type Env, Hono } from "hono";

// TODO: This only works with node, fix asset loading for other runtimes as well
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const clientDistPath = join(__dirname, "../../embedded-client/dist");

export function createRouter<E extends Env>(mountedPath: string): Hono<E> {
  const router = new Hono<E>();

  // TODO: This only works with node, fix asset loading for other runtimes as well
  router.get("/client/index.js", async (c) => {
    const indexPath = join(clientDistPath, "index.js");

    if (!existsSync(indexPath)) {
      return c.text("File not found", 404);
    }

    try {
      const content = readFileSync(indexPath, "utf-8");
      return new Response(content, {
        status: 200,
        headers: {
          "Content-Type": "application/javascript",
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
      });
    } catch (error) {
      return c.text("Error reading file", 500);
    }
  });

  router.get("/*", (c) => {
    return c.html(
      <html lang="en">
        <head>
          <title>Embedded App</title>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>
        <body>
          <div id="root" data-mount-path={mountedPath}>
            <p>Loading React application...</p>
          </div>
          <script
            type="module"
            src={path.resolve(mountedPath, "client/index.js")}
          />
        </body>
      </html>,
    );
  });

  return router;
}
