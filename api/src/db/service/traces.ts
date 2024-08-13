import { and, desc, sql } from "drizzle-orm";
import type { ApiContext } from "../../lib/types.js";
import { otelSpans } from "../schema.js";

export async function getSpans(ctx: ApiContext) {
  const db = ctx.get("db");

  return await db
    .select()
    .from(otelSpans)
    .where(and(sql`parsed_payload->>'scope_name' = 'fpx-tracer'`))
    .orderBy(desc(otelSpans.createdAt));
};
