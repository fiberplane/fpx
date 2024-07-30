import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { WEBHONC_ID_KEY, WEBHONC_REQUEST_KEY } from "./types.js";

export function useWebhoncId() {
  return useQuery({
    queryKey: [WEBHONC_ID_KEY],
    queryFn: () => fetch("/v0/webhonc_id").then((r) => r.json()),
    select: (data) => data?.connectionId,
  });
}

export function useWebhoncRequest(connectionId: string) {
  return useQuery({
    queryKey: [connectionId, WEBHONC_REQUEST_KEY],
    queryFn: () => getLatestWebhoncRequest(connectionId),
    enabled: !!connectionId,
  });
}

function getLatestWebhoncRequest(
  connectionId: string,
): Promise<WebhookRequest> {
  return fetch(`/v0/webhonc_request/${connectionId}`).then((r) => r.json());
}

export const WebhookRequestSchema = z.object({
  headers: z.record(z.string()),
  query: z.record(z.string()).optional(),
  body: z.any(),
});

export type WebhookRequest = z.infer<typeof WebhookRequestSchema>;
