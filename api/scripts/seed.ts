import fs from "node:fs/promises";
import { createClient } from "@libsql/client";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/libsql";
import { githubIssues, mizuLogs } from "../src/db/schema";
config({ path: ".dev.vars" });

import { DEFAULT_DATABASE_URL } from "../src/constants.js";

// Set the environment vars
config({ path: ".dev.vars" });
const databaseUrl = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL not defined");
  process.exit(1);
}

const db = drizzle(createClient({ url: databaseUrl }));

(async () => {
  const issuesFile = await fs.readFile(
    "./scripts/seed-assets/github_issues.json",
    "utf8",
  );
  const logsFile = await fs.readFile(
    "./scripts/seed-assets/mizu_logs.json",
    "utf8",
  );
  const issues = JSON.parse(issuesFile);
  const logs = JSON.parse(logsFile);

  let {rowsAffected} = await db.insert(githubIssues).values(issues);
  console.log('Inserted', rowsAffected, 'github issues');
  ({ rowsAffected} = await db.insert(mizuLogs).values(logs));
  console.log('Inserted', rowsAffected, 'logs');
})();
