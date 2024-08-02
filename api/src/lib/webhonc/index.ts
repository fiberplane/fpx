import WebSocket from "ws";
import { z } from "zod";
import logger from "../../logger.js";
import type { WebhookRequest } from "../types.js";
import { getWebHoncConnectionId, setWebHoncConnectionId } from "./store.js";

const WsMessageSchema = z.discriminatedUnion("event", [
  z.object({
    event: z.literal("connection_open"),
    payload: z.object({
      connectionId: z.string(),
    }),
  }),
  z.object({
    event: z.literal("request_incoming"),
    payload: z.object({
      headers: z.record(z.string()),
      query: z.record(z.string()),
      body: z.any(),
      path: z.array(z.string()),
    }),
  }),
]);

export function connectToWebhonc(
  url: string,
  wsConnections: Set<WebSocket>,
  webhookRequests: Map<string, WebhookRequest>,
) {
  const socket = new WebSocket(url);

  socket.onopen = () => {
    logger.debug("Connected to the webhonc service");
  };

  socket.onmessage = (event) => {
    logger.debug("Received message from the webhonc service:", event.data);
    const message = WsMessageSchema.parse(JSON.parse(event.data.toString()));

    switch (message.event) {
      case "connection_open": {
        const { connectionId } = message.payload;
        setWebHoncConnectionId(connectionId);
        for (const ws of wsConnections) {
          ws.send(
            JSON.stringify({
              event: "connection_open",
              payload: { connectionId },
            }),
          );
        }
        break;
      }
      case "request_incoming": {
        const connectionId = getWebHoncConnectionId();
        if (!connectionId) {
          logger.error(
            "Webhonc connection ID not found, cannot store webhook request",
          );
          return;
        }
        webhookRequests.set(connectionId, message.payload);
        for (const ws of wsConnections) {
          ws.send(JSON.stringify(message));
        }
        break;
      }
    }
  };

  socket.onclose = (event) => {
    logger.debug(
      "Webhonc connection closed",
      event.reason,
      event.code,
      event.wasClean,
    );
  };

  socket.onerror = (event) => {
    logger.error("Webhonc connection error", event.message);
  };

  return socket;
}
