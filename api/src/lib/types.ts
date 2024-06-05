// Only using for global types

import type * as schema from "@/db/schema";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type { WebSocket } from "ws";

export type Bindings = {
  DATABASE_URL: string;
  OPENAI_API_KEY: string;
  GITHUB_TOKEN: string;
};

export type Variables = {
  db: LibSQLDatabase<typeof schema>;
  wsConnections: Set<WebSocket>;
  // biome-ignore lint/suspicious/noExplicitAny:
  dbErrors: Array<any>;
};
