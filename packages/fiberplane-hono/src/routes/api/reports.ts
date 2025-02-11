import { Hono } from "hono";
import { PLAYGROUND_SERVICES_URL } from "../../constants.js";
import { logIfDebug } from "../../debug.js";
import type { FiberplaneAppType } from "../../types.js";

export default function createReportsApiRoute(apiKey: string) {
  const app = new Hono<FiberplaneAppType>();

  // Proxy all requests to fp-services but attach a token
  app.all("*", async (c) => {
    logIfDebug(
      c,
      "[reports]",
      `- ${c.req.method} ${c.req.path} -`,
      "Proxying request to fiberplane api",
    );

    const url = `${PLAYGROUND_SERVICES_URL}${c.req.path}`;

    const contentType = c.req.header("content-type");
    const headers = new Headers();
    // Only include the bare minimum authentication and content-type headers
    headers.set("Authorization", `Bearer ${apiKey}`);
    if (contentType) {
      logIfDebug(
        c,
        "[reports]",
        `- ${c.req.method} ${c.req.path} -`,
        "content type attached to proxied request:",
        contentType,
      );
      headers.set("content-type", contentType);
    }

    const result = fetch(url, {
      method: c.req.method,
      headers,
      body: c.req.raw.body,
    });

    return result;
  });

  return app;
}
