import type { Next } from "hono";
import { cors } from "hono/cors";
import type { AppContext } from "../types";

export const dashboardCors = (c: AppContext, next: Next) => {
  if (c.env.LILO_ENV === "local") {
    const corsMiddleware = cors({
      origin: "http://localhost:*",
      credentials: true,
    });
    return corsMiddleware(c, next);
  }

  return next();
};
