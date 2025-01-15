/** @jsx jsx */
/** @jsxImportSource hono/jsx */
import { jsx } from "hono/jsx";
import type { EmbeddedRouterOptions } from "../router.js";

import { existsSync, readFileSync } from "node:fs";
import path, { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Hono } from "hono";

// TODO: This only works with node, fix asset loading for other runtimes as well
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const clientDistPath = join(__dirname, "../../../playground/dist");

export default function createPlayground({
  cdn,
  mountedPath,
}: EmbeddedRouterOptions) {
  const app = new Hono();

  // TODO: This only works with node, fix asset loading for other runtimes as well
  // Skip the file handler when CDN is set, this one should be dropped eventually anyways
  if (!cdn) {
    app.get("/client/:file", async (c) => {
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

  app.get("/*", (c) => {
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

  return app;
}