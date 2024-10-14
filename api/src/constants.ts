import path from "node:path";

export const DEFAULT_DATABASE_URL = "file:fpx.db";

export const USER_PROJECT_ROOT_DIR = path.resolve(
  process.env.FPX_WATCH_DIR ?? process.cwd(),
);

/** The port on which to run our ephemeral, local authentication server */
export const FPX_AUTH_SERVER_PORT = 3579;

export const FPX_PORT = +(process.env.FPX_PORT ?? 8788);
