/** @jsx jsx */
/** @jsxImportSource hono/jsx */
import { jsx } from "hono/jsx";
// TODO: I think we need to include this if the consumer app doesn't have hono/jsx in tsconfig
// TODO: Figure out how to fix this

import { Hono } from "hono";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { readFileSync } from "node:fs";
import type { BlankEnv, BlankSchema, Env, Schema } from "hono/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const clientDistPath = join(__dirname, "../../embedded-client/dist");

// TODO: Using Hono types returns in:
// Type instantiation is excessively deep and possibly infinite.
export function createRoutes<
  E extends Env = BlankEnv,
  S extends Schema = BlankSchema,
  BasePath extends string = "/",
>() {
  const app = new Hono<E, S, BasePath>();

  app.get("/client/index.js", async (c) => {
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

  app.get("/", (c) => {
    return c.html(
      <html lang="en">
        <head>
          <title>Embedded App</title>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>
        <body>
          <div id="root">
            <p>Loading React application...</p>
          </div>
          <script type="module" src="/fp/client/index.js" />
        </body>
      </html>,
    );
  });

  // Add a catch-all route to debug routing
  app.all("*", (c) => {
    return c.text("Catch-all route", 404);
  });

  return app;
}
