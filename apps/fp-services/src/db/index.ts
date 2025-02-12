import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export * from "./schema";

export type DBSchema = typeof schema;

/**
 * Initializes a database connection using Drizzle ORM.
 * @param {D1Database} env - The D1 database environment
 * @returns {ReturnType<typeof drizzle>} The initialized Drizzle ORM instance
 */
export const initDbConnect = (env: D1Database) => drizzle(env, { schema });
