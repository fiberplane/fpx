import { DurableObject } from "cloudflare:workers";
import type { WsMessage } from "@fiberplane/fpx-types";
import type { Bindings } from "./types";

export class WebHonc extends DurableObject<Bindings> {
  sessions: Map<string, WebSocket>;
  // IMPROVE - Use Cloudflare KV instead, with an expiration time on the keys
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

    // Load the pending responses from storage
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
      const event = parsedMessage?.event;
      const payload = parsedMessage?.payload;
      const correlationId = parsedMessage?.correlationId;

      // The Fiberplane Studio API sends responses back to us with a correlationId
      // If we're receiving a response, we need to store the response in our pending responses map
      if (event === "response_outgoing" && correlationId) {
        console.debug(
          "Setting pending response value for correlationId:",
          payload.correlationId,
        );
        // Re-serialize the payload to ensure it's a valid JSON string
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
      for (const [correlationId, response] of this.pendingResponses.entries()) {
        if (response === null) {
          this.pendingResponses.delete(correlationId);
        }
      }
    } catch (error) {
      console.error("Error closing WebSocket:", error);
    }
  }

  private async waitForWebhookResponse(
    correlationId: string,
    timeoutMs = 5000,
  ): Promise<string> {
    const pollIntervalMs = 150;
    const maxAttempts = Math.ceil(timeoutMs / pollIntervalMs);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
      const response = this.pendingResponses.get(correlationId);

      if (response) {
        this.pendingResponses.delete(correlationId);
        return response;
      }
    }

    return JSON.stringify({
      status: 500,
      body: "Webhook response timeout exceeded",
    });
  }

  public async pushWebhookData(connectionId: string, data: WsMessage) {
    const correlationId = crypto.randomUUID();

    console.debug(
      `Serializing and sending data to (ConnectionId: ${connectionId}, CorrelationId: ${correlationId})`,
    );
    const ws = this.sessions.get(connectionId);

    const payload = JSON.stringify({
      ...data,
      correlationId,
    });

    console.debug(
      "Sending payload to Studio with correlationId:",
      correlationId,
    );

    this.pendingResponses.set(correlationId, null);
    if (ws) {
      ws.send(payload);
    }

    console.debug(
      "Awaiting pending response for correlationId:",
      correlationId,
    );

    return this.waitForWebhookResponse(correlationId);
  }
}
