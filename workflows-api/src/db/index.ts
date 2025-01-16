import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema.js";

// Initialize SQLite database with libsql
const client = createClient({
  url: "file:workflows.db",
});

// Create drizzle database instance
export const db = drizzle(client, { schema });
