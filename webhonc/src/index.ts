import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { z } from "zod";
import type { Bindings } from "./types";
import { resolveBody, resolveWebhoncId } from "./utils";
import { WebHonc } from "./webhonc";

const app = new Hono<{ Bindings: Bindings }>();

app.use(logger());

app.get(
  "/connect/:id?",
  zValidator("param", z.object({ id: z.string().optional() })),
  async (c) => {
    if (c.req.header("upgrade") !== "websocket") {
      return new Response("Not a websocket request", { status: 426 });
    }

    const { id } = c.req.valid("param");

    // Durable Object ID
    let doId: DurableObjectId | undefined;

    if (id) {
      doId = resolveWebhoncId(c, id);
    }

    if (!doId) {
      doId = c.env.WEBHONC.newUniqueId();
    }

    const webhonc = c.env.WEBHONC.get(doId);

    return webhonc.fetch(c.req.raw);
  },
);

app.all(
  "/:id/*",
  zValidator("param", z.object({ id: z.string() })),
  async (c) => {
    const { id } = c.req.valid("param");

    console.debug("Handling request with id", id);
    const webhoncId = resolveWebhoncId(c, id);

    if (!webhoncId) {
      console.error("No webhonc found for id", id);
      return new Response("No connection established on this id", {
        status: 404,
      });
    }

    const webhonc = c.env.WEBHONC.get(webhoncId);

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

    const stringifiedResponse = await webhonc.pushWebhookData(id, {
      event: "request_incoming",
      payload: {
        headers: headersJson,
        query,
        body,
        method,
        path: pathComponentsWithoutId,
      },
    });

    let textOrJson: "text" | "json" = "text";

    // TODO - Validate
    const parsedResponse = JSON.parse(stringifiedResponse);

    const proxiedHeaders = new Headers();
    for (const [key, value] of Object.entries(parsedResponse?.headers ?? {})) {
      // TODO - handle octet stream?
      if (key.toLowerCase() === "content-length") {
        if ((value as string)?.toLowerCase()?.startsWith("application/json")) {
          textOrJson = "json";
        }
        continue;
      }
      proxiedHeaders.set(key, value as string);
    }

    const proxiedBody = parsedResponse?.body as string;
    const proxiedStatus = parsedResponse?.status as number;

    return c.newResponse(proxiedBody, {
      headers: proxiedHeaders,
      status: proxiedStatus,
    });
  },
);

export { WebHonc };

export default app;
