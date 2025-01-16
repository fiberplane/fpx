/** @jsx jsx */
/** @jsxImportSource hono/jsx */
import { jsx } from "hono/jsx";

import { type Env, Hono } from "hono";
import { html, raw } from "hono/html";
import type { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";
import type { EmbeddedMiddlewareOptions } from "./index.js";

interface RouterOptions extends EmbeddedMiddlewareOptions {
  mountedPath: string;
}

export function createRouter<E extends Env>({
  cdn,
  spec,
  mountedPath,
}: RouterOptions): Hono<E> {
  const router = new Hono<E>();

  const cssBundleUrl = new URL("index.css", cdn).href;

  const jsBundleUrl = new URL("index.js", cdn).href;

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
export const apiSpecScriptTag = (
  spec: OpenAPIV3_1.Document | OpenAPIV3.Document,
) => {
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
      return (await response.json()) as
        | OpenAPIV3_1.Document
        | OpenAPIV3.Document;
    }

    throw new Error("Invalid spec path or URL");
  } catch (error) {
    console.error("Error loading API spec:", error);
    return undefined;
  }
}
