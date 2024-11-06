import path from "node:path";
import { WsMessageSchema } from "@fiberplane/fpx-types";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import WebSocket from "ws";
import { z } from "zod";
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

type WebhoncManagerConfig = {
  host: string;
  db: LibSQLDatabase<typeof schema>;
  wsConnections: Set<WebSocket>;
};

const WebhoncOutgoingResponseSchema = z.object({
  status: z.number(),
  body: z.string(),
  headers: z.record(z.string()),
});

type WebhoncOutgoingResponse = z.infer<typeof WebhoncOutgoingResponseSchema>;

function isWebhoncOutgoingResponse(
  value: unknown,
): value is WebhoncOutgoingResponse {
  const parseResult = WebhoncOutgoingResponseSchema.safeParse(value);
  if (!parseResult.success) {
    logger.error(
      "Invalid webhonc outgoing response",
      parseResult.error.format(),
    );
  }
  return parseResult.success;
}

let socket: WebSocket | undefined = undefined;
let reconnectTimeout: NodeJS.Timeout | undefined = undefined;
let reconnectAttempt = 0;
let config: WebhoncManagerConfig | undefined = undefined;

const MAX_RECONNECT_DELAY = 30000;
const INITIAL_RECONNECT_DELAY = 1000;

export function setupWebhonc(managerConfig: WebhoncManagerConfig) {
  config = managerConfig;
}

export async function start() {
  if (!config) {
    throw new Error("WebhoncManager not initialized");
  }

  if (socket) {
    logger.debug("Webhonc process already started. Skipping...");
    return;
  }

  logger.debug("Starting Webhonc process...");
  await connect();
}

export async function stop() {
  if (socket) {
    socket.close(1000, "Closing connection due to settings change");
    socket = undefined;
  }
  if (reconnectTimeout) {
    logger.debug("closing reconnect timeout");
    clearTimeout(reconnectTimeout);
  }
}

export function getStatus() {
  if (!config) {
    throw new Error("WebhoncManager not initialized");
  }

  return {
    connected: socket?.readyState === WebSocket.OPEN,
    connectionId: socket ? getWebHoncConnectionId(config.db) : null,
  };
}

async function connect() {
  if (!config) {
    throw new Error("WebhoncManager not initialized");
  }

  const protocol = config.host.startsWith("localhost") ? "ws" : "wss";
  const maybeWebhoncId = await getWebHoncConnectionId(config.db);
  socket = new WebSocket(
    `${protocol}://${config.host}/connect${maybeWebhoncId ? `/${maybeWebhoncId}` : ""}`,
  );

  setupSocketListeners();
}

function setupSocketListeners() {
  if (!socket || !config) {
    return;
  }

  socket.onopen = () => {
    logger.debug(`Connected to the webhonc service at ${config?.host}`);
    reconnectAttempt = 0;
  };

  socket.onmessage = async (event) => {
    logger.debug("Received message from the webhonc service:", event.data);
    try {
      const response = await handleMessage(event);
      // NOTE - We want to notify webhonc about the response so that it can "proxy" it
      if (socket && response && isWebhoncOutgoingResponse(response)) {
        socket.send(
          JSON.stringify({
            event: "response_outgoing",
            payload: response,
            // @ts-expect-error - AHHHHH
            correlationId: response?.correlationId,
          }),
        );
      }
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
    // If the connection is closed due to a normal close, we don't want to reconnect
    if (event.code === 1000) {
      return;
    }

    scheduleReconnect();
  };

  socket.onerror = (event) => {
    logger.error("Webhonc connection error", event);
  };
}

function scheduleReconnect() {
  const reconnectDelay = Math.min(
    INITIAL_RECONNECT_DELAY * 2 ** reconnectAttempt,
    MAX_RECONNECT_DELAY,
  );

  logger.debug(`Attempting to reconnect in ${reconnectDelay}ms`);

  reconnectTimeout = setTimeout(async () => {
    reconnectAttempt++;
    await connect();
  }, reconnectDelay);
}

async function handleMessage(event: WebSocket.MessageEvent) {
  if (!config) {
    return;
  }

  const parsedMessage = WsMessageSchema.parse(
    // it probably doesn't make sense that we're parsing the entire message and then re-serializing it
    // for the request maker but this is the easiest way to move forward for now
    JSON.parse(event.data.toString()),
  );

  let correlationId = "NA";
  try {
    if (parsedMessage.event === "request_incoming") {
      const reparsedMessage = JSON.parse(event.data.toString());
      if (typeof reparsedMessage?.correlationId === "string") {
        correlationId = reparsedMessage?.correlationId;
      }
    }
  } catch (_err) {
    console.warn("[webhonc] Failed to parse correlation id");
  }

  const handler = messageHandlers[parsedMessage.event];

  if (handler) {
    // @ts-expect-error - TODO: fix this type error
    return await handler({ ...parsedMessage, correlationId }, config);
  }

  logger.error(`Unhandled event type: ${parsedMessage.event}`);
  return null;
}

const messageHandlers: {
  [K in z.infer<typeof WsMessageSchema>["event"]]: (
    message: Extract<z.infer<typeof WsMessageSchema>, { event: K }>,
    config: WebhoncManagerConfig,
  ) => Promise<null | WebhoncOutgoingResponse>;
} = {
  trace_created: async (_message, _config) => {
    logger.debug("trace_created message received, no action required");
    return null;
  },
  login_success: async () => {
    logger.debug("login_success message received, this should never happen");
    return null;
  },
  connection_open: async (message, config) => {
    const { connectionId } = message.payload;
    logger.debug(
      "connection_open message received, setting webhonc connection id:",
      connectionId,
    );
    // Await this call so that the webhonc id is set before the query on the studio side is invalidated
    await setWebHoncConnectionId(config.db, connectionId);
    for (const ws of config.wsConnections) {
      ws.send(
        JSON.stringify({
          event: "connection_open",
          payload: { connectionId },
        }),
      );
    }
    return null;
  },
  request_incoming: async (message, config) => {
    console.log("REQUEST INCOMING", message);
    // no trace id is coming from the websocket, so we generate one
    const db = config.db;
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

      const { responseBody, responseHeaders } = await handleSuccessfulRequest(
        db,
        requestId,
        duration,
        response,
        traceId,
      );

      return {
        status: response.status,
        body: responseBody ?? "",
        headers: responseHeaders,
        // @ts-expect-error - I did not want to update the package types for webhonc messages
        correlationId: message?.correlationId ?? "HI",
        fullMessage: message,
      };
    } catch (error) {
      logger.error("Error making request", error);
      const duration = Date.now() - startTime;
      await handleFailedRequest(db, requestId, traceId, duration, error);
      return {
        status: 500,
        body: "Internal server error",
        headers: {},
        // @ts-expect-error - I did not want to update the package types for webhonc messages
        correlationId: message?.correlationId ?? "HI",
      };
    }
  },
};
