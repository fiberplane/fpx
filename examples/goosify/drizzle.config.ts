import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

let dbConfig: ReturnType<typeof defineConfig>;
if (process.env.GOOSIFY_ENV === "production") {
  config({ path: "./.prod.vars" });
  dbConfig = defineConfig({
    schema: "./src/db/schema.ts",
    out: "./drizzle/migrations",
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
} else {
  config({ path: "./.dev.vars" });
  const localD1DB = getLocalD1DB();
  if (!localD1DB) {
    process.exit(1);
  }

  dbConfig = defineConfig({
    schema: "./src/db/schema.ts",
    out: "./drizzle/migrations",
    dialect: "sqlite",
    dbCredentials: {
      url: localD1DB,
    },
  });
}

export default dbConfig;

// Modified from: https://github.com/drizzle-team/drizzle-orm/discussions/1545
function getLocalD1DB() {
  try {
    const basePath = path.resolve(".wrangler");
    const files = fs
      .readdirSync(basePath, { encoding: "utf-8", recursive: true })
      .filter((f) => f.endsWith(".sqlite"));

    // In case there are multiple .sqlite files, we want the most recent one.
    files.sort((a, b) => {
      const statA = fs.statSync(path.join(basePath, a));
      const statB = fs.statSync(path.join(basePath, b));
      return statB.mtime.getTime() - statA.mtime.getTime();
    });
    const dbFile = files[0];

    if (!dbFile) {
      throw new Error(`.sqlite file not found in ${basePath}`);
    }

    const url = path.resolve(basePath, dbFile);

    return url;
  } catch (err) {
    if (err instanceof Error) {
      console.log(`Error resolving local D1 DB: ${err.message}`);
    } else {
      console.log(`Error resolving local D1 DB: ${err}`);
    }
  }
}
