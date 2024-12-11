import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { Context } from "hono";
import type { User } from "./db/schema";

export type DatabaseType = DrizzleD1Database<Record<string, never>> & {
  $client: D1Database;
};

export type Variables = Record<string, never>;

export type Bindings = {
  DB: D1Database;
  GITHUB_ID: string;
  GITHUB_SECRET: string;
  // PRIVATE_KEY: string;
  SESSION_SECRET: string;
};

export type AppType = {
  Bindings: Bindings;
  Variables: {
    db: DatabaseType;
    currentUser: User | null;
    // token?: string;
    // "refresh-token"?: string;
    // "user-github"?: {
    //   login: string;
    //   email: string;
    //   [key: string]: unknown;
    // };
  };
};

export type AppContext = Context<AppType>;
