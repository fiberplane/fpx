import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { Context } from "hono";
import type { User } from "./db/schema";

export type DatabaseType = DrizzleD1Database<Record<string, never>> & {
  $client: D1Database;
};

export type Bindings = {
  // D1 database (added as binding in wrangler.toml)
  DB: D1Database;
  // GitHub OAuth app credentials
  GITHUB_ID: string;
  GITHUB_SECRET: string;
  // Public key for signing JWT tokens
  PUBLIC_KEY: string;
  // Private key for signing JWT tokens
  PRIVATE_KEY: string;
  // Session secret for signing cookies
  SESSION_SECRET: string;
};

export type AppType = {
  Bindings: Bindings;
  Variables: {
    db: DatabaseType;
    currentUser: User | null;
  };
};

export type AppContext = Context<AppType>;
