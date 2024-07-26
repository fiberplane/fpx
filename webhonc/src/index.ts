import { Hono } from "hono";
import { upgradeWebSocket } from "hono/cloudflare-workers";
import type { Bindings, Variables } from "./types";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { createHonoMiddleware } from "@fiberplane/hono";
import type { WSContext } from "hono/ws";
import { WebHonc } from "./webhonc";
import { HTTPException } from "hono/http-exception";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// we need the second map for the reverse lookup
const wsIds = new Map<WSContext, string>();

app.use(createHonoMiddleware(app));
// app.use(async (c, next) => {
// 	if (wsConnections) {
// 		c.set("WS_CONNECTIONS", wsConnections);
// 	}
// 	if (wsIds) {
// 		c.set("WS_IDS", wsIds);
// 	}
// 	await next();
// });

app.use(async (c, next) => {
	const id = c.env.WEBHONC.idFromName("webhonc");
	const webhonc = c.env.WEBHONC.get(id);
	// TODO: revisit this: maybe have a durable object session per client
	c.set("WEBHONC", webhonc);
	await next();
});

app.get("/", async (c) => {
	if (c.req.header("upgrade") !== "websocket") {
		throw new HTTPException(402);
	}

	const webhonc = c.get("WEBHONC");

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

		const headers = c.req.raw.headers;
		const query = c.req.query();

		const webhonc = c.get("WEBHONC");

		const headersJson = {};
		for (const [key, value] of headers.entries()) {
			headersJson[key] = value;
		}

		await webhonc.pushWebhookData(
			id,
			JSON.stringify({ headers: headersJson, query, body }),
		);

		return c.text("OK");
	},
);

export { WebHonc };

export default app;
