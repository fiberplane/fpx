import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import type { Bindings, Variables } from "./types";
import { WebHonc } from "./webhonc";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.get("/ws", async (c) => {
  if (c.req.header("upgrade") !== "websocket") {
    return new Response("Not a websocket request", { status: 426 });
  }

  const id = c.env.WEBHONC.newUniqueId();
  const webhonc = c.env.WEBHONC.get(id) as DurableObjectStub<WebHonc>;

  return webhonc.fetch(c.req.raw);
});

app.all(
  "/:id/*",
  zValidator("param", z.object({ id: z.string() })),
  async (c) => {
    const { id } = c.req.valid("param");

    // We need to serialize the path components without the id
    // so we can send it down the wire and replay it locally
    const pathComponentsWithoutId = c.req.path
      .split("/")
      .filter((comp) => comp.length > 0)
      .slice(1);

    const method = c.req.method;

    const contentType = c.req.header("content-type");

    let body: string | FormData | undefined;
    switch (contentType) {
      case "application/json":
        body = await c.req.json();
        break;
      case "application/x-www-form-urlencoded":
        body = await c.req.formData();
        break;
      case "text/plain":
        body = await c.req.text();
        break;
      default:
        body = await c.req.text();
        break;
    }

    const query = c.req.query();

    const doId = c.env.WEBHONC.idFromString(id);
    const webhonc = c.env.WEBHONC.get(doId) as DurableObjectStub<WebHonc>;

    const headers = c.req.raw.headers;
    const headersJson: { [key: string]: string } = {};
    for (const [key, value] of headers.entries()) {
      headersJson[key] = value;
    }

    await webhonc.pushWebhookData(
      id,
      JSON.stringify({
        event: "request_incoming",
        payload: {
          headers: headersJson,
          query,
          body,
          method,
          path: pathComponentsWithoutId,
        },
      }),
    );

    return c.text("OK");
  },
);

export { WebHonc };

export default app;
