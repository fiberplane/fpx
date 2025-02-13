import { Hono, type Env } from "hono";
import type { FiberplaneAppType, SanitizedEmbeddedOptions } from "../types.js";

export default function createPlayground<E extends Env>(
  sanitizedOptions: SanitizedEmbeddedOptions<E>,
) {
  const app = new Hono<E & FiberplaneAppType<E>>();

  const { cdn, ...options } = sanitizedOptions;
  const cssBundleUrl = new URL("index.css", cdn).href;
  const jsBundleUrl = new URL("index.js", cdn).href;

  app.get("/*", (c) => {
    return c.html(
      <html lang="en">
        <head>
          <title>API Playground</title>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="stylesheet" href={cssBundleUrl} />
        </head>
        <body>
          <div id="root" data-options={JSON.stringify(options)} />
          <script type="module" src={jsBundleUrl} />
        </body>
      </html>,
    );
  });
  return app;
}
