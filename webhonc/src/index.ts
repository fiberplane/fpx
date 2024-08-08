import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { z } from "zod";
import type { Bindings, Variables } from "./types";
import { resolveBody, resolveWebhoncId } from "./utils";
import { WebHonc } from "./webhonc";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use(logger());

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

    console.debug("Handling request with id", id);
    const webhonc = resolveWebhoncId(c, id);

    if (!webhonc) {
      console.error("No webhonc found for id", id);
      return new Response("No connection established on this id", {
        status: 404,
      });
    }

    // We need to serialize the path components without the id
    // so we can send it down the wire and replay it locally
    const pathComponentsWithoutId = c.req.path
      .split("/")
      .filter((comp) => comp.length > 0)
      .slice(1);

    const method = c.req.method;

    const body: string | FormData | null = await resolveBody(c);

    const query = c.req.query();

    const headers = c.req.raw.headers;
    const headersJson: { [key: string]: string } = {};
    for (const [key, value] of headers.entries()) {
      // content-length calculated dynamically by the fetch client so we don't send them down the wire
      if (
        key.toLowerCase() === "content-length" ||
        key.toLowerCase() === "boundary"
      ) {
        continue;
      }
      headersJson[key] = value;
    }

    await webhonc.pushWebhookData(id, {
      event: "request_incoming",
      payload: {
        headers: headersJson,
        query,
        body,
        method,
        path: pathComponentsWithoutId,
      },
    });

    return c.text("OK");
  },
);

export { WebHonc };

export default app;
