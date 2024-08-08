import path from "node:path";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
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
import { WsMessageSchema } from "../types.js";
import { resolveUrlQueryParams } from "../utils.js";
import { getWebHoncConnectionId, setWebHoncConnectionId } from "./store.js";

// TODO: maintain and surface the webhonc connection state so that UI
// can adapt accordingly
// TODO: handle the case where the webhonc service is down, exponentially try
// reconnecting etc
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
    try {
      await handleMessage(event, wsConnections, db);
    } catch (error) {
      logger.error("Error handling message from webhonc:", error);
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
  trace_created: async (_message, _wsConnections, _db) => {
    logger.debug("trace_created message received, no action required");
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
    // TODO: change this to an OTEL trace id after #102 is merged
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

    const supplementedHeaders = {
      "x-fpx-trace-id": traceId,
      "x-fpx-webhonc-id": webhoncId ?? "",
    };

    if (newRequest?.requestHeaders) {
      newRequest.requestHeaders = {
        ...newRequest?.requestHeaders,
        ...supplementedHeaders,
      };
    } else {
      newRequest.requestHeaders = supplementedHeaders;
    }

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
