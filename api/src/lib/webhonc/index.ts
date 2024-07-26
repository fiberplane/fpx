import WebSocket from 'ws';
import logger from "../../logger.js";
import { z } from "zod";
import { setWebHoncConnectionId } from './store.js';

/*
const WebhoncMessageSchema = z.object({
  connectionId: z.string(),
  headers: z.record(z.string()),
  query: z.record(z.string()),
  body: z.string(),
});
*/

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
    }),
  }),
])

export function connectToWebhonc(url: string, wsConnections: Set<WebSocket>) {
  const socket = new WebSocket(url);

  socket.onopen = () => {
    logger.debug("Connected to webhonc");
  };

  socket.onmessage = (event) => {
    logger.debug("Received message from webhonc:", event.data);
    const message = WsMessageSchema.parse(JSON.parse(event.data.toString()));

    switch (message.event) {
      case "connection_open":
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
      case "request_incoming":
        const { headers, query, body } = message.payload;
        console.log("sending request_incoming to websockets");
        console.log("wsConnections",wsConnections.size);
        for (const ws of wsConnections) {
          ws.send(
            JSON.stringify({
              event: "request_incoming",
              payload: { headers, query, body },
            }),
          );
        }
        break;
    }
  };

  socket.onclose = (event) => {
    logger.debug("Webhonc connection closed", event.reason, event.code, event.wasClean);
  };

  socket.onerror = (event) => {
    logger.error("Webhonc connection error", event.message);
  };

  return socket;
}


