import type { HonoRequest } from "hono";
import { RANDOM_HEADER } from "./constants";

export function getAuthHeader(req: HonoRequest) {
  return req.header("Authorization");
}

export function getRandomHeader(req: HonoRequest) {
  return req.header(RANDOM_HEADER);
}
