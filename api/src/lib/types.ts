// Only using for global types

import type { LibSQLDatabase } from "drizzle-orm/libsql";
// biome-ignore lint/style/useImportType: <explanation>
import * as schema from "../db/schema.js";
import type { WebSocket } from "ws";

export type Bindings = {
  DATABASE_URL: string;
  OPENAI_API_KEY: string;
  GITHUB_TOKEN: string;
};

export type Variables = {
  db: LibSQLDatabase<typeof schema>;
  wsConnections: Set<WebSocket>;
  dbErrors: Array<any>;
};

