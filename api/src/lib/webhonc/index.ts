import path from "node:path";
import { WsMessageSchema } from "@fiberplane/fpx-types";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import WebSocket from "ws";
import type { z } from "zod";
import * as schema from "../../db/schema.js";
import logger from "../../logger.js";
import { resolveServiceArg } from "../../probe-routes.js";
import { generateOtelTraceId } from "../otel/index.js";
import {
  executeProxyRequest,
  handleFailedRequest,
  handleSuccessfulRequest,
} from "../proxy-request/index.js";
import { resolveUrlQueryParams } from "../utils.js";
import { getWebHoncConnectionId, setWebHoncConnectionId } from "./store.js";

// TODO: maintain and surface the webhonc connection state so that UI
// can adapt accordingly
export async function connectToWebhonc(
  host: string,
  db: LibSQLDatabase<typeof schema>,
  wsConnections: Set<WebSocket>,
) {
  const MAX_RECONNECT_DELAY = 30000; // Maximum delay between reconnection attempts (30 seconds)
  const INITIAL_RECONNECT_DELAY = 1000; // Initial delay for reconnection (1 second)
  let reconnectAttempt = 0;
  let reconnectTimeout: NodeJS.Timeout | null = null;

  const connect = async () => {
    const protocol = host.startsWith("localhost") ? "ws" : "wss";
    const maybeWebhoncId = await getWebHoncConnectionId(db);
    const socket = new WebSocket(
      `${protocol}://${host}/connect${maybeWebhoncId ? `/${maybeWebhoncId}` : ""}`,
    );

    const cleanup = () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close(1000, "fpx server shutting down");
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };

    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);

    socket.onopen = () => {
      logger.debug(`Connected to the webhonc service at ${host}`);
      reconnectAttempt = 0; // Reset reconnect attempt counter on successful connection
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

      // Implement reconnection logic
      const reconnectDelay = Math.min(
        INITIAL_RECONNECT_DELAY * 2 ** reconnectAttempt,
        MAX_RECONNECT_DELAY,
      );

      logger.debug(`Attempting to reconnect in ${reconnectDelay}ms`);

      reconnectTimeout = setTimeout(async () => {
        reconnectAttempt++;
        await connect();
      }, reconnectDelay);
    };

    socket.onerror = (event) => {
      logger.error("Webhonc connection error", event.message);
    };

    return socket;
  };

  return await connect();
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
  connection_open: async (message, wsConnections, db) => {
    const { connectionId } = message.payload;
    setWebHoncConnectionId(db, connectionId);
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
    const traceId = generateOtelTraceId();

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

    const webhoncId = await getWebHoncConnectionId(db);

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
        requestHeaders: newRequest.requestHeaders,
        requestMethod: newRequest.requestMethod,
        requestBody: newRequest.requestBody,
        requestUrl,
      });

      const duration = Date.now() - startTime;

      await handleSuccessfulRequest(db, requestId, duration, response, traceId);

      // Store the request in the database
    } catch (error) {
      logger.error("Error making request", error);
      const duration = Date.now() - startTime;
      await handleFailedRequest(db, requestId, traceId, duration, error);
    }
  },
};
