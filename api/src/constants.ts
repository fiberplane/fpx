import path from "node:path";

export const DEFAULT_DATABASE_URL = "file:fpx.db";

export const USER_PROJECT_ROOT_DIR = path.resolve(
  process.env.FPX_WATCH_DIR ?? process.cwd(),
);
