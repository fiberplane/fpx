/** @jsx jsx */
/** @jsxImportSource hono/jsx */
// @ts-nocheck
import { jsx } from "hono/jsx";

import { existsSync, readFileSync } from "node:fs";
import path, { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { type Env, Hono } from "hono";
import type { EmbeddedMiddlewareOptions } from "./index.js";

// TODO: This only works with node, fix asset loading for other runtimes as well
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const clientDistPath = join(__dirname, "../../../playground/dist");

interface RouterOptions extends EmbeddedMiddlewareOptions {
  mountedPath: string;
}

export function createRouter<E extends Env>({
  cdn,
  mountedPath,
}: RouterOptions): Hono<E> {
  const router = new Hono<E>();

  // TODO: This only works with node, fix asset loading for other runtimes as well
  // Skip the file handler when CDN is set, this one should be dropped eventually anyways
  if (!cdn) {
    router.get("/client/:file", async (c) => {
      const file = c.req.param("file");
      const filePath = join(clientDistPath, file);

      if (!existsSync(filePath)) {
        return c.text("File not found", 404);
      }

      try {
        const content = readFileSync(filePath, "utf-8");
        const contentType = file.endsWith(".js")
          ? "application/javascript"
          : "text/css";

        return new Response(content, {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "no-store, no-cache, must-revalidate",
            Pragma: "no-cache",
          },
        });
      } catch (error) {
        return c.text("Error reading file", 500);
      }
    });
  }

  const cssBundleUrl = cdn
    ? new URL("index.css", cdn).href
    : path.resolve(mountedPath, "client/index.css");

  const jsBundleUrl = cdn
    ? new URL("index.js", cdn).href
    : path.resolve(mountedPath, "client/index.js");

  router.get("/*", (c) => {
    return c.html(
      <html lang="en">
        <head>
          <title>FPX</title>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="stylesheet" href={cssBundleUrl} />
        </head>
        <body>
          <div id="root" data-mounted-path={mountedPath} />
          <script type="module" src={jsBundleUrl} />
        </body>
      </html>,
    );
  });

  return router;
}
