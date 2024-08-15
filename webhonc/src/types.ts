import type { Context } from "hono";
import type { WSContext } from "hono/ws";
import type { WebHonc } from "./webhonc";

export type Bindings = {
  [key in keyof CloudflareBindings]: CloudflareBindings[key];
};

export type WebHoncContext = Context<{ Bindings: Bindings }>;
