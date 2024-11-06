import { DurableObject } from "cloudflare:workers";
import type { WsMessage } from "@fiberplane/fpx-types";
import type { Bindings } from "./types";

export class WebHonc extends DurableObject<Bindings> {
  sessions: Map<string, WebSocket>;
  // TODO - Use KV instead with an expiration time on the keys
  pendingResponses: Map<string, string | null>;

  constructor(ctx: DurableObjectState, env: Bindings) {
    super(ctx, env);
    this.ctx = ctx;
    this.env = env;
    this.sessions = new Map();
    this.pendingResponses = new Map();

    for (const ws of this.ctx.getWebSockets()) {
      const { connectionId } = ws.deserializeAttachment();
      this.sessions.set(connectionId, ws);
    }

    ctx.blockConcurrencyWhile(async () => {
      this.pendingResponses =
        (await ctx.storage.get("pendingResponses")) || this.pendingResponses;
    });
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
    console.debug("Received message from WS connection:", message);
    try {
      const messageString =
        message instanceof ArrayBuffer
          ? new TextDecoder().decode(message)
          : message;

      const parsedMessage = JSON.parse(messageString);
      console.log("parsedMessage", parsedMessage);
      const { event, payload, correlationId } = parsedMessage;
      if (event === "response_outgoing" && correlationId) {
        console.debug(
          "Setting pending response VALUE for correlationId:",
          payload.correlationId,
        );
        const payloadString = JSON.stringify(payload);
        this.pendingResponses.set(correlationId, payloadString);
      }
    } catch (error) {
      console.error("Error parsing message from WS connection:", error);
    }
  }

  async webSocketClose(
    ws: WebSocket,
    code: number,
    reason: string,
    wasClean: boolean,
  ) {
    console.debug(
      "WebSocket closed:",
      code,
      reason,
      wasClean,
      ws.deserializeAttachment(),
    );
    try {
      ws.close(code);
    } catch (error) {
      console.error("Error closing WebSocket:", error);
    }
  }

  public async pushWebhookData(connectionId: string, data: WsMessage) {
    console.debug("Serializing and sending data to connection:", connectionId);
    const ws = this.sessions.get(connectionId);
    const correlationId = crypto.randomUUID();
    const payload = JSON.stringify({
      ...data,
      correlationId,
    });

    console.log("boots - sending payload", payload);

    console.debug(
      "Awaiting pending response for correlationId:",
      correlationId,
    );

    this.pendingResponses.set(correlationId, null);
    if (ws) {
      ws.send(payload);
    }

    // Try for ~5 seconds to get the response, sleeping 150ms between attempts
    for (let i = 0; i < 33; i++) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      const response = this.pendingResponses.get(correlationId);
      if (response) {
        this.pendingResponses.delete(correlationId);
        return response;
      }
    }

    return JSON.stringify({
      status: 500,
      body: "Timeout waiting for response",
    });
  }
}
