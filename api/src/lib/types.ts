// Only using for global types

import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type { WebSocket } from "ws";
import { z } from "zod";
import type * as schema from "../db/schema.js";

export type Bindings = {
  FPX_DATABASE_URL: string;
  OPENAI_API_KEY: string;
  GITHUB_TOKEN: string;
};

export type Variables = {
  db: LibSQLDatabase<typeof schema>;
  wsConnections: Set<WebSocket>;
};

export const WebhookRequestSchema = z.object({
  headers: z.record(z.string()),
  query: z.record(z.string()).optional(),
  body: z.any(),
});

export type WebhookRequest = z.infer<typeof WebhookRequestSchema>;
