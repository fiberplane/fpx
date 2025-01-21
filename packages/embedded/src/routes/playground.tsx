/** @jsx jsx */
/** @jsxImportSource hono/jsx */
import { jsx } from "hono/jsx";

import { Hono } from "hono";
import type { EmbeddedRouterOptions, RouterSpec } from "../router.js";
import type { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";
import { html, raw } from "hono/html";

export default function createPlayground({
  cdn,
  mountedPath,
  spec,
}: EmbeddedRouterOptions) {
  const app = new Hono();

  const cssBundleUrl = new URL("index.css", cdn).href;

  const jsBundleUrl = new URL("index.js", cdn).href;

  app.get("/*", async (c) => {
    const resolvedSpec = await resolveSpec(spec, new URL(c.req.url).origin);

    return c.html(
      <html lang="en">
        <head>
          <title>
            {(resolvedSpec.type === "success" &&
              resolvedSpec.spec?.info?.title) ??
              "FPX Playground"}
          </title>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="stylesheet" href={cssBundleUrl} />
        </head>
        <body>
          <div id="root" data-mounted-path={mountedPath} />
          {resolvedSpec.type === "success" ? (
            apiSpecScriptTag(resolvedSpec.spec)
          ) : (
            <script id="fp-api-spec-error" type="application/json">
              {raw(JSON.stringify(resolvedSpec))}
            </script>
          )}
          <script type="module" src={jsBundleUrl} />
        </body>
      </html>,
    );
  });

  return app;
}

/**
 * The HTML to load the @scalar/api-reference JavaScript package.
 */
export const apiSpecScriptTag = (
  spec: OpenAPIV3_1.Document | OpenAPIV3.Document | undefined,
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

function ensureOriginServer(
  doc: OpenAPIV3_1.Document | OpenAPIV3.Document,
  origin: string,
): void {
  if (!doc?.servers?.some((server) => server.url === origin)) {
    doc.servers = [
      {
        url: origin,
        description: "Current environment",
      },
      ...(doc.servers || []),
    ];
  }
}

export type ResolvedSpec =
  | {
    type: "success";
    spec: OpenAPIV3_1.Document | OpenAPIV3.Document | undefined;
    source: RouterSpec["type"];
  }
  | {
    type: "error";
    error: string;
    source: RouterSpec["type"];
    retryable: boolean;
    attemptedUrl?: string;
  };

async function resolveSpec(
  spec?: RouterSpec,
  origin?: string,
): Promise<ResolvedSpec> {
  if (!spec || spec.type === "empty") {
    return { type: "success", spec: undefined, source: "empty" };
  }

  switch (spec.type) {
    case "raw":
      try {
        if (origin) {
          ensureOriginServer(spec.value, origin);
        }
        return { type: "success", spec: spec.value, source: "raw" };
      } catch (error) {
        return {
          type: "error",
          error: "Failed to process raw spec",
          source: "raw",
          retryable: false,
        };
      }

    case "url":
    case "path": {
      const url = spec.type === "url" ? spec.value : `${origin}${spec.value}`;
      try {
        console.log("Fetching spec from", url);
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const doc = (await response.json()) as
          | OpenAPIV3_1.Document
          | OpenAPIV3.Document;

        if (origin) {
          ensureOriginServer(doc, origin);
        }
        return { type: "success", spec: doc, source: spec.type };
      } catch (error) {
        return {
          type: "error",
          error:
            error instanceof Error
              ? error.message
              : "Failed to fetch or parse spec",
          source: spec.type,
          retryable: true,
          attemptedUrl: url,
        };
      }
    }

    default: {
      const _exhaustiveCheck: never = spec;
      return {
        type: "error",
        error: "Unknown spec type",
        source: "empty",
        retryable: false,
      };
    }
  }
}
