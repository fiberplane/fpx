import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./migrations",
  dialect: "sqlite",
  driver: "d1-http",
  dbCredentials: {
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    token: process.env.CLOUDFLARE_D1_TOKEN!,
  },
});
