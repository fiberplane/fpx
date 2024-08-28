import { config } from "dotenv";
import type { defineConfig } from "drizzle-kit";

config({ path: "./.dev.vars" });

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
};
