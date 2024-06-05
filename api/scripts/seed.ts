import fs from "node:fs/promises";
import { createClient } from "@libsql/client";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/libsql";
import { githubIssues, mizuLogs } from "../src/db/schema";
config({ path: ".dev.vars" });

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("DATABASE_URL not defined");
  process.exit(1);
}

const db = drizzle(createClient({ url: dbUrl }));

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

  await db.insert(githubIssues).values(issues);
  await db.insert(mizuLogs).values(logs);
})();
