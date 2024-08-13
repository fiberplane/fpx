// Only using for global types

import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type { Context } from "hono";
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

export type ApiContext = Context<{ Bindings: Bindings, Variables: Variables }>;

/**
 * ==========================================================
 * TODO: move anything below here to a separate package when pnpm monorepo is ready
 * ==========================================================
 */

export type WsMessage = z.infer<typeof WsMessageSchema>;

export const WsMessageSchema = z.discriminatedUnion("event", [
  z.object({
    event: z.literal("trace_created"),
    // TODO: this should be an array of traces instead of the queryKeys to invalidate on the browser
    payload: z.array(z.literal("mizuTraces")),
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
      query: z.record(z.string()),
      path: z.array(z.string()),
      body: z.any(),
      method: z.string(),
    }),
  }),
]);
