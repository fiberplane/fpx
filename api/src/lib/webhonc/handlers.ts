import path from "node:path";
import type { WsMessageSchema } from "@fiberplane/fpx-types";
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
import type { WebhoncManagerConfig, WebhoncOutgoingResponse } from "./types.js";

type WsMessage = z.infer<typeof WsMessageSchema>;
type WithCorrelationId<T> = T & { correlationId?: string };

export async function handleTraceCreated() {
  logger.debug("trace_created message received, no action required");
  return null;
}

export async function handleLoginSuccess() {
  logger.debug("login_success message received, this should never happen");
  return null;
}

export async function handleConnectionOpen(
  message: Extract<WsMessage, { event: "connection_open" }>,
  config: WebhoncManagerConfig,
): Promise<null> {
  const { connectionId } = message.payload;
  logger.debug(
    "connection_open message received, setting webhonc connection id:",
    connectionId,
  );
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
}

type RequestIncomingMessage = WithCorrelationId<
  Extract<WsMessage, { event: "request_incoming" }>
>;

export async function handleRequestIncoming(
  message: RequestIncomingMessage,
  config: WebhoncManagerConfig,
  correlationId?: string,
): Promise<WebhoncOutgoingResponse> {
  // No trace id is coming from the websocket, so we generate one
  const db = config.db;
  const traceId = generateOtelTraceId();

  const serviceTarget = resolveServiceArg(process.env.FPX_SERVICE_TARGET);
  const resolvedPath = path.join(serviceTarget, ...message.payload.path);
  const requestUrl = resolveUrlQueryParams(resolvedPath, message.payload.query);

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
      correlationId: correlationId ?? "NA",
    };
  } catch (error) {
    logger.error("Error making request", error);
    const duration = Date.now() - startTime;
    await handleFailedRequest(db, requestId, traceId, duration, error);
    return {
      status: 500,
      body: "Internal server error",
      headers: {},
      correlationId: correlationId ?? "NA",
    };
  }
}

export const handleMessage = (
  message: WsMessage,
  config: WebhoncManagerConfig,
  correlationId?: string,
) => {
  switch (message.event) {
    case "login_success":
      return handleLoginSuccess();
    case "trace_created":
      return handleTraceCreated();
    case "connection_open":
      return handleConnectionOpen(message, config);
    case "request_incoming":
      return handleRequestIncoming(message, config, correlationId);
    default: {
      // @ts-expect-error - We're handling all possible events in the switch statement
      logger.warn(`Unknown message event: ${message?.event}`);
      return null;
    }
  }
};
