import path from "node:path";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { WsMessageSchema } from "../types.js"
import WebSocket from "ws";
import type { z } from "zod";
import * as schema from "../../db/schema.js";
import logger from "../../logger.js";
import { resolveServiceArg } from "../../probe-routes.js";
import {
  executeProxyRequest,
  handleFailedRequest,
  handleSuccessfulRequest,
} from "../proxy-request/index.js";
import { resolveUrlQueryParams } from "../utils.js";
import { getWebHoncConnectionId, setWebHoncConnectionId } from "./store.js";

export function connectToWebhonc(
  host: string,
  db: LibSQLDatabase<typeof schema>,
  wsConnections: Set<WebSocket>,
) {
  const protocol = host.startsWith("localhost") ? "ws" : "wss";
  const socket = new WebSocket(`${protocol}://${host}/ws`);

  socket.onopen = () => {
    logger.debug(`Connected to the webhonc service at ${host}`);
  };

  socket.onmessage = async (event) => {
    logger.debug("Received message from the webhonc service:", event.data);
    await handleMessage(event, wsConnections, db);
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

async function handleMessage(
  event: WebSocket.MessageEvent,
  wsConnections: Set<WebSocket>,
  db: LibSQLDatabase<typeof schema>,
) {
  const parsedMessage = WsMessageSchema.parse(
    // it probably doesn't make sense that we're parsing the entire message and then re-serializing it
    // for the request maker but this is the easiest way to move forward for now
    JSON.parse(event.data.toString()),
  );

  const handler = messageHandlers[parsedMessage.event] as (
    message: typeof parsedMessage,
    wsConnections: Set<WebSocket>,
    db: LibSQLDatabase<typeof schema>,
  ) => Promise<void>;

  if (handler) {
    await handler(parsedMessage, wsConnections, db);
  } else {
    logger.error(`Unhandled event type: ${parsedMessage.event}`);
  }
}

const messageHandlers: {
  [K in z.infer<typeof WsMessageSchema>["event"]]: (
    message: Extract<z.infer<typeof WsMessageSchema>, { event: K }>,
    wsConnections: Set<WebSocket>,
    db: LibSQLDatabase<typeof schema>,
  ) => Promise<void>;
} = {
  trace_created: async (message, wsConnections, db) => {
    logger.info("trace_created message received, no action required");
  },
  connection_open: async (message, wsConnections) => {
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
  },
  request_incoming: async (message, _wsConnections, db) => {
    // no trace id is coming from the websocket, so we generate one
    const traceId = crypto.randomUUID();

    const serviceTarget = resolveServiceArg(process.env.FPX_SERVICE_TARGET);
    const resolvedPath = path.join(serviceTarget, ...message.payload.path);
    const requestUrl = resolveUrlQueryParams(
      resolvedPath,
      message.payload.query,
    );

    const startTime = Date.now();

    const newRequest: schema.NewAppRequest = {
      requestMethod: message.payload
        .method as schema.NewAppRequest["requestMethod"],
      requestUrl,
      requestHeaders: message.payload.headers,
      requestPathParams: {},
      requestQueryParams: message.payload.query,
      requestBody: message.payload.body,
      requestRoute: message.payload.path.join("/"),
    };

    const webhoncId = getWebHoncConnectionId();

    // TODO: assert that the request headers are not null
    newRequest!.requestHeaders!["x-fpx-trace-id"] = traceId;
    newRequest!.requestHeaders!["x-fpx-webhonc-id"] = webhoncId ?? "";

    const [{ id: requestId }] = await db
      .insert(schema.appRequests)
      .values(newRequest)
      .returning({ id: schema.appRequests.id });

    try {
      const response = await executeProxyRequest({
        requestHeaders: message.payload.headers,
        // @ts-expect-error - Trust me, the request method is correct, and it's a string
        requestMethod: message.payload.method,
        requestBody: message.payload.body,
        requestUrl,
      });

      const duration = Date.now() - startTime;

      await handleSuccessfulRequest(db, requestId, duration, response);

      // Store the request in the database
    } catch (error) {
      logger.error("Error making request", error);
      const duration = Date.now() - startTime;
      await handleFailedRequest(db, requestId, traceId, duration, error);
    }
  },
};
