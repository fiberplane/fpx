// Only using for global types

import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type { WebSocket } from "ws";
import type * as schema from "../db/schema.js";
import type * as webhoncType from "./webhonc/index.js"

export type Bindings = {
  FPX_DATABASE_URL: string;
  OPENAI_API_KEY: string;
  GITHUB_TOKEN: string;
};

export type Variables = {
  db: LibSQLDatabase<typeof schema>;
  wsConnections: Set<WebSocket>;
  webhonc: typeof webhoncType
};
