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

// type MessageSchema = z.infer<typeof messageSchema>;

export const useTracesSocket = () => {
  const { toast } = useToast();
  const spanIds = new Set<string>();

  const handleMessageEvent = useHandler(function onMessage(
    this: WebSocket,
    ev: MessageEvent,
  ) {
    console.log("Received websocket message", ev.data);

    // let action: MessageSchema | undefined;
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
                // console.log('boom!');
                toastId.dismiss();
              },
              description: (
                <Link to={`/requests/otel/${parentId}`}>view details</Link>
              ),
            });
          }
        }
        // const parentId = newSpans[0];
        // console.log('parentId', parentId, newSpans);
        // action.details.newSpans.forEach((spanId) => {
        //   if (!spanIds.has(spanId)) {
        //     spanIds.add(spanId);
        //     toast({
        //       title: 'New Span Added',
        //       description: spanId
        //     });
        //   }
        // });
      }
    } catch (error) {
      console.error(error);
      // swallow error
    }
    // let action: unknown;
    // try {
    //   action = JSON.parse(ev?.data);
    // } catch {
    //   // Silent - we log stuff below
    // }

    // const decodedAction =
    //   action && isFPXWebsocketMessage(action) ? action : null;
    // if (!decodedAction) {
    //   console.warn(
    //     "Received websocket message that we cannot react to",
    //     action,
    //   );
    //   return;
    // }
    // queryClient.invalidateQueries({ queryKey: decodedAction.payload });
  });

  useWebSocket("/api/ws", handleMessageEvent);
};
