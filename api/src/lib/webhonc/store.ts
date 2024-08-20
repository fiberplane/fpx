import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type * as schema from "../../db/schema.js";
import { getSetting, upsertSettings } from "../settings/index.js";

export async function setWebHoncConnectionId(
  db: LibSQLDatabase<typeof schema>,
  id: string,
) {
  await upsertSettings(db, { webhoncConnectionId: id });
}

export async function getWebHoncConnectionId(
  db: LibSQLDatabase<typeof schema>,
) {
  return ((await getSetting(db, "webhoncConnectionId"))?.value ??
    false) as string;
}
