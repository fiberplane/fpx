import type { HonoRequest } from "hono";

export function shouldHonk(r: HonoRequest) {
  const { shouldHonk } = r.query();
  return typeof shouldHonk !== "undefined";
}
