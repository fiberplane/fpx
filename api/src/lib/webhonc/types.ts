import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type WebSocket from "ws";
import { z } from "zod";
import type * as schema from "../../db/schema.js";
import logger from "../../logger.js";

export type WebhoncManagerConfig = {
  host: string;
  db: LibSQLDatabase<typeof schema>;
  wsConnections: Set<WebSocket>;
};

const WebhoncOutgoingResponseSchema = z.object({
  status: z.number(),
  body: z.string(),
  headers: z.record(z.string()),
  correlationId: z.string(),
});

export type WebhoncOutgoingResponse = z.infer<
  typeof WebhoncOutgoingResponseSchema
>;

export function isWebhoncOutgoingResponse(
  value: unknown,
): value is WebhoncOutgoingResponse {
  const parseResult = WebhoncOutgoingResponseSchema.safeParse(value);
  if (!parseResult.success) {
    logger.warn(
      "Invalid webhonc outgoing response",
      parseResult.error.format(),
    );
  }
  return parseResult.success;
}
