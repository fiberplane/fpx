import { DurableObject } from "cloudflare:workers";
import type { Bindings } from "./types";

export class WebHonc extends DurableObject<Bindings> {
	wsConnections: Map<string, WebSocket> = new Map();

	constructor(ctx: DurableObjectState, env: Bindings) {
		super(ctx, env);
		this.ctx = ctx;
		this.wsConnections = new Map();
	}

	async fetch(req: Request) {
		const webSocketPair = new WebSocketPair();
		const [client, server] = Object.values(webSocketPair);
		const clientId = crypto.randomUUID();

		// this.ctx.acceptWebSocket(server);
		// this.ctx.setWebSocketAutoResponse(
		// 	new WebSocketRequestResponsePair("ping", "pong"),
		// );

		server.accept();
		server.serializeAttachment({ clientId });
		server.send(JSON.stringify({ clientId }));

		this.wsConnections.set(clientId, server);

		server.addEventListener("close", (cls) => {
			server.close(cls.code, "Durable Object is closing WebSocket");
		});

		return new Response(null, {
			status: 101,
			webSocket: client,
		});
	}

	async webSocketClose(
		ws: WebSocket,
		code: number,
		reason: string,
		wasClean: boolean,
	) {
		ws.close(code);
	}

	public async pushWebhookData(id: string, data: string) {
		console.log("wsConnections", this.wsConnections);
		const ws = this.wsConnections.get(id);

		if (ws) {
			console.log("pushing data to ws", ws);
			ws.send(data);
		}
	}
}
