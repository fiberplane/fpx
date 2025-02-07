import { Hono } from "hono";
import { PLAYGROUND_SERVICES_URL } from "../../constants.js";

export default function createReportsApiRoute(apiKey: string) {
  const app = new Hono();

  // Proxy all requests to fp-services but attach a token
  app.all("*", async (c) => {
    const url = `${PLAYGROUND_SERVICES_URL}${c.req.path}`;

    const contentType = c.req.header("content-type");
    const headers = new Headers();
    // Only include the bare minimum authentication and content-type headers
    headers.set("Authorization", `Bearer ${apiKey}`);
    if (contentType) {
      headers.set("content-type", contentType);
    }

    return fetch(url, {
      method: c.req.method,
      headers,
      body: c.req.raw.body,
    });
  });

  return app;
}
