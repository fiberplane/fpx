import { html, raw } from "hono/html";
/** @jsx jsx */
/** @jsxImportSource hono/jsx */
// @ts-nocheck
import { jsx } from "hono/jsx";

import { existsSync, readFileSync } from "node:fs";
import path, { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { type Env, Hono } from "hono";
import type { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";
import type { EmbeddedMiddlewareOptions } from "./index.js";

// TODO: This only works with node, fix asset loading for other runtimes as well
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const clientDistPath = join(__dirname, "../../../playground/dist");

interface RouterOptions extends EmbeddedMiddlewareOptions {
  mountedPath: string;
  spec?: OpenAPIV3_1.Document | OpenAPIV3.Document | string;
}

export function createRouter<E extends Env>({
  cdn,
  spec,
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


  router.get("/*", async (c) => {
    const resolvedSpec = await resolveSpec(spec);
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
          {resolvedSpec ? apiSpecScriptTag(resolvedSpec) : null}
          <script type="module" src={jsBundleUrl} />
        </body>
      </html>,
    );
  });

  return router;
}

/**
 * The HTML to load the @scalar/api-reference JavaScript package.
 */
export const apiSpecScriptTag = (spec: OpenAPIV3_1.Document | OpenAPIV3.Document) => {
  return html`
    <script
      id="fp-api-spec"
      type="application/json"
    >
      ${raw(JSON.stringify(spec))}
    </script>
  `;
};

async function resolveSpec(
  spec?: OpenAPIV3_1.Document | OpenAPIV3.Document | string,
): Promise<OpenAPIV3_1.Document | OpenAPIV3.Document | undefined> {
  if (!spec) {
    return undefined;
  }
  if (typeof spec !== "string") {
    return spec;
  }

  try {
    // Handle URLs
    if (spec.startsWith("http://") || spec.startsWith("https://")) {
      const response = await fetch(spec);
      return await response.json() as OpenAPIV3_1.Document | OpenAPIV3.Document;
    }

    throw new Error("Invalid spec path or URL");
  } catch (error) {
    console.error("Error loading API spec:", error);
    return undefined;
  }
}
