import { Link } from "react-router-dom";
import { z } from "zod";

import { useToast } from "@/components/ui/use-toast";
import { useHandler } from "@fiberplane/hooks";
import { useWebSocket } from "./useWebSocket";

// Define the schema for the details object
const detailsSchema = z.object({
  newSpans: z.array(z.array(z.string())),
});

// Define the main schema
const messageSchema = z.object({
  type: z.literal("spanAdded"),
  details: detailsSchema,
});

export const useTracesSocket = () => {
  const { toast } = useToast();
  const spanIds = new Set<string>();

  const handleMessageEvent = useHandler(function onMessage(
    this: WebSocket,
    ev: MessageEvent,
  ) {
    console.debug("Received websocket message", ev?.data);
    try {
      const payload = JSON.parse(ev.data);
      const { data: action, error } = messageSchema.safeParse(payload);
      if (error) {
        console.error("error", error.message, payload);
        return;
      }

      if (action.type === "spanAdded") {
        const { newSpans } = action.details;
        for (const spans of newSpans) {
          const parentId = spans[0];
          if (!spanIds.has(parentId)) {
            spanIds.add(parentId);
            const toastId = toast({
              title: "New trace Added",
              onClick: () => {
                toastId.dismiss();
              },
              description: (
                <Link to={`/requests/otel/${parentId}`}>view details</Link>
              ),
            });
          }
        }
      }
    } catch (error) {
      console.error(error);
    }
  });

  useWebSocket("/api/ws", handleMessageEvent);
};
