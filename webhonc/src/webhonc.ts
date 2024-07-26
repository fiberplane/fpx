import { DurableObject } from "cloudflare:workers";
import type { Bindings } from "./types";

export class WebHonc extends DurableObject<Bindings> {
	sessions: Map<string, WebSocket> = new Map();

	constructor(ctx: DurableObjectState, env: Bindings) {
		super(ctx, env);
		this.ctx = ctx;
		this.env = env;
		this.sessions = new Map();

		for (const ws of this.ctx.getWebSockets()) {
			const { connectionId } = ws.deserializeAttachment();
			this.sessions.set(connectionId, ws);
		}
	}

	async fetch(_req: Request) {
		const webSocketPair = new WebSocketPair();
		const [client, server] = Object.values(webSocketPair);

		const connectionId = this.ctx.id.toString();

		this.ctx.acceptWebSocket(server);

		// we send the connectionId down to the client
		server.send(
			JSON.stringify({ event: "connection_open", payload: { connectionId } }),
		);
		this.sessions.set(connectionId, server);
		server.serializeAttachment({ connectionId });

		return new Response(null, {
			status: 101,
			webSocket: client,
		});
	}

	webSocketMessage(_ws: WebSocket, message: string | ArrayBuffer) {
		console.log("message", message);
	}

	async webSocketClose(
		ws: WebSocket,
		code: number,
		_reason: string,
		_wasClean: boolean,
	) {
		ws.close(code);
	}

	public async pushWebhookData(connectionId: string, data: string) {
		const ws = this.sessions.get(connectionId);
		console.log(this.sessions.keys());
		if (ws) {
			console.log("pushing data to ws", connectionId, ws);
			ws.send(data);
		}
	}
}
