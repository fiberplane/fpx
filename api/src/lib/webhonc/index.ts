import { type WsMessage, WsMessageSchema } from "@fiberplane/fpx-types";
import WebSocket from "ws";
import logger from "../../logger/index.js";
import { handleMessage } from "./handlers.js";
import { getWebHoncConnectionId } from "./store.js";
import {
  type WebhoncManagerConfig,
  isWebhoncOutgoingResponse,
} from "./types.js";

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
      const response = await dispatchMessage(event);
      const shouldNotifyResponse =
        response && isWebhoncOutgoingResponse(response);
      // NOTE - We want to notify webhonc about the response so that it can "proxy" it
      if (socket && shouldNotifyResponse) {
        socket.send(
          JSON.stringify({
            event: "response_outgoing",
            payload: response,
            correlationId: response.correlationId,
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

/**
 * Dispatches a websocket message to the appropriate handler on the api
 */
async function dispatchMessage(event: WebSocket.MessageEvent) {
  if (!config) {
    return;
  }

  const parsedMessage = WsMessageSchema.parse(
    // it probably doesn't make sense that we're parsing the entire message and then re-serializing it
    // for the request maker but this is the easiest way to move forward for now
    JSON.parse(event.data.toString()),
  );

  const correlationId = extractCorrelationId(event, parsedMessage);

  return handleMessage(parsedMessage, config, correlationId);
}

/**
 * Extracts the correlation id from the message
 *
 * This is a HACK to avoid having to specify the correlation id on the strict fiberplane package types
 */
function extractCorrelationId(
  event: WebSocket.MessageEvent,
  parsedMessage: WsMessage,
): string | undefined {
  // HACK - We need to extract the correlation id from the message
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
  return correlationId;
}
