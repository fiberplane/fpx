import type { Flags, Template } from "./types";
import { getPackageManager } from "./utils";

export interface Context {
  cwd: string;
  packageManager: string;
  path?: string;
  description?: string;
  template?: Template;
  database?: string;
  flags: Flags;
  databaseConnectionString?: string;

  indexFile?: string;
  schemaFile?: string;
  seedFile?: string;
  sessionId: string;

  superchargerBaseUrl?: string;
  superchargerApiKey?: string;
}

export function getContext(): Context {
  return {
    cwd: process.cwd(),
    // TODO - Improve this random id
    // TODO - concatenate with project name somehow
    sessionId: Math.random().toString(36).substring(2),
    packageManager: getPackageManager() ?? "npm",
    flags: [],

    superchargerApiKey: process.env.HONC_API_KEY,
    superchargerBaseUrl: process.env.HONC_BASE_URL,
  };
}
