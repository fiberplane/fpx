import type { DrizzleD1Database } from "drizzle-orm/d1";
import type * as schema from "./db/schema";
import type { createLogger } from "./logger";

export type Bindings = {
  DB: D1Database;
  R2: R2Bucket;
  OPENAI_API_KEY: string;
  ANTHROPIC_API_KEY: string;
  HONC_LOG_LEVEL: string;
  HONC_PASSWORD: string;
  HONC_IS_LOCAL: string;
};

export type Variables = {
  db: DrizzleD1Database<typeof schema>;
  appLogger: ReturnType<typeof createLogger>;
};

export type HatchApp = {
  Bindings: Bindings;
  Variables: Variables;
};