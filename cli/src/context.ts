import type { ScaffoldedFiles } from "@/integrations/code-gen";
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

  /**
   * Promise that resolves to the scaffolded files.
   *
   * @remarks
   * We save the promise that resolves to the scaffolded files in context so that the code can generated in the background,
   * while we install dependencies and finish setting up the project.
   * This is because API requests to generate code from Supercharger are slowww
   */
  superchargerPromise: Promise<ScaffoldedFiles | null>;
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
    superchargerPromise: Promise.resolve(null),
  };
}
