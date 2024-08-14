import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type * as schema from "../../db/schema.js";
import { getSetting, upsertSettings } from "../settings/index.js";

const WEBHONC_CONNECTION_ID_KEY = "webhoncConnectionId";

export async function setWebHoncConnectionId(
  db: LibSQLDatabase<typeof schema>,
  id: string,
) {
  await upsertSettings(db, { [WEBHONC_CONNECTION_ID_KEY]: id });
}

export async function getWebHoncConnectionId(
  db: LibSQLDatabase<typeof schema>,
) {
  return await getSetting(db, WEBHONC_CONNECTION_ID_KEY) as string;
}
