import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import fs from "node:fs/promises";
import {
  githubIssues,
  mizuLogs,
  newGithubIssueSchema,
  newMizuLogSchema,
} from "../src/db/schema";
import { config } from "dotenv";
config({ path: ".dev.vars" });

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("DATABASE_URL not defined");
  process.exit(1);
}

const db = drizzle(createClient({ url: dbUrl }));

(async () => {
  const issuesFile = await fs.readFile("./scripts/github_issues.json", "utf8");
  const logsFile = await fs.readFile("./scripts/mizu_logs.json", "utf8");
  const issues = JSON.parse(issuesFile);
  const logs = JSON.parse(logsFile);

  await db.insert(githubIssues).values(issues);
  await db.insert(mizuLogs).values(logs);
})();
