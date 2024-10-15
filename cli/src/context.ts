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
}

export function getContext(): Context {
  return {
    cwd: process.cwd(),
    packageManager: getPackageManager() ?? "npm",
    flags: [],
  };
}
