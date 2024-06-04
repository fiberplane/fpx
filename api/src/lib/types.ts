// Only using for global types

import { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "@/db/schema";
import type { WebSocket } from "ws";

export type Bindings = {
  DATABASE_URL: string;
  OPENAI_API_KEY: string;
};

export type Variables = {
  db: LibSQLDatabase<typeof schema>
	wsConnections: Set<WebSocket>;
	dbErrors: Array<any>;
}
