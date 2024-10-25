import { initDbConnect } from "../db";
import * as schema from "../db/schema";

export async function refreshCredits(d1: D1Database) {
  const db = initDbConnect(d1);
  const result = await db
    .update(schema.users)
    .set({
      aiRequestCredits: 100,
    })
    .returning();

  console.log(
    "Updated refresh credits for users (truncated)",
    result.slice(0, 100),
  );
}
