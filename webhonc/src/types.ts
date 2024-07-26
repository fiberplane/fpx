import type { WSContext } from "hono/ws";
import type { WebHonc } from "./webhonc";

export type Bindings = {
  [key in keyof CloudflareBindings]: CloudflareBindings[key];
};

export type Variables = {
  WS_CONNECTIONS: Map<string, WSContext>;
  WS_IDS: Map<WSContext, string>;
  WEBHONC: DurableObjectStub<WebHonc>;
};
