import type { DrizzleD1Database } from "drizzle-orm/d1";
import type * as schema from "./db/schema";
// NOTE - Circular reference, but only via types, so we should be fine. Right?!
import type { GooseEgg } from "./goose-egg";
import type { createLogger } from "./logger";

export type Bindings = {
  DB: D1Database;
  R2: R2Bucket;
  AI: Ai;
  OPENAI_API_KEY: string;
  ANTHROPIC_API_KEY: string;
  HONC_LOG_LEVEL: string;
  HONC_PASSWORD: string;
  HONC_IS_LOCAL: string;
  GOOSE_EGG: DurableObjectNamespace<GooseEgg>;
};

export type Variables = {
  db: DrizzleD1Database<typeof schema>;
  appLogger: ReturnType<typeof createLogger>;
};

export type HatchApp = {
  Bindings: Bindings;
  Variables: Variables;
};
