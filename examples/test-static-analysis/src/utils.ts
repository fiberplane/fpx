import type { HonoRequest } from "hono";

export function getAuthHeader(req: HonoRequest) {
  return req.header("Authorization");
}
