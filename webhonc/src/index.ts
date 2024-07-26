import { createHonoMiddleware } from "@fiberplane/hono";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { upgradeWebSocket } from "hono/cloudflare-workers";
import { HTTPException } from "hono/http-exception";
import type { WSContext } from "hono/ws";
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
	"/h/:id",
	zValidator("param", z.object({ id: z.string() })),
	async (c) => {
		const { id } = c.req.valid("param");

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
    console.log("headers", headers);
		const headersJson: { [key: string]: string } = {};
		for (const [key, value] of headers.entries()) {
      console.log("key", key);
      console.log("value", value);
			headersJson[key] = value;
		}

    console.log("headersJson", headersJson);

		await webhonc.pushWebhookData(
			id,
			JSON.stringify({ headers: headersJson, query, body }),
		);

		return c.text("OK");
	},
);

export { WebHonc };

export default app;
