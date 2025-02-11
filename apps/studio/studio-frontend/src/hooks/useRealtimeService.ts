import { MIZU_TRACES_KEY, PROBED_ROUTES_KEY } from "@/queries";
import { useEffect, useState } from "react";
import useWebSocket from "react-use-websocket";
import z from "zod";

const FpxWebsocketMessageSchema = z.discriminatedUnion("event", [
  z.object({
    event: z.literal("trace_created"),
    payload: z.array(z.enum([MIZU_TRACES_KEY, PROBED_ROUTES_KEY])),
  }),
  z.object({
    event: z.literal("login_success"),
    payload: z.array(z.literal("userInfo")),
  }),
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
      query: z.record(z.string()).optional(),
      body: z.any(),
    }),
  }),
]);

type FpxWebsocketMessage = z.infer<typeof FpxWebsocketMessageSchema>;

const isFPXWebsocketMessage = (m: unknown): m is FpxWebsocketMessage => {
  return FpxWebsocketMessageSchema.safeParse(m).success;
};

export function useRealtimeService() {
  const [parsedMessage, setParsedMessage] =
    useState<FpxWebsocketMessage | null>(null);

  const { lastJsonMessage } = useWebSocket("/ws", {
    heartbeat: true,
    onOpen: (ev) => {
      console.debug("Websocket connection opened: ", ev.target);
    },
    onClose: (ev) => {
      console.debug("Websocket connection closed: ", ev.reason);
    },
    onError: (err) => {
      console.error("Websocket error:", err);
    },
  });

  useEffect(() => {
    if (lastJsonMessage) {
      try {
        if (isFPXWebsocketMessage(lastJsonMessage)) {
          setParsedMessage(lastJsonMessage);
        }
      } catch (error) {
        console.error("Failed to parse websocket message:", error);
      }
    }
  }, [lastJsonMessage]);

  return parsedMessage;
}
