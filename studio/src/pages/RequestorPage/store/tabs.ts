import { z } from "zod";
import type { RequestMethod, RequestType } from "../types";

export const RequestsPanelTabSchema = z.enum([
  "params",
  "headers",
  "body",
  "docs",
  "messages",
]);

export type RequestsPanelTab = z.infer<typeof RequestsPanelTabSchema>;

export const isRequestsPanelTab = (tab: unknown): tab is RequestsPanelTab => {
  return RequestsPanelTabSchema.safeParse(tab).success;
};

export const getVisibleRequestPanelTabs = (route: {
  requestType: RequestType;
  method: RequestMethod;
  openApiSpec: unknown | undefined;
}): RequestsPanelTab[] => {
  let result: RequestsPanelTab[] = [];
  if (route.requestType === "websocket") {
    result = ["params", "headers", "messages"];
  } else {
    result = ["params", "headers"];
  }
  const canHaveBody = route.method !== "GET" && route.method !== "HEAD";
  if (canHaveBody) {
    result.push("body");
  }
  // If we have docs, show the docs tab
  const hasDocs = !!route.openApiSpec;
  if (hasDocs) {
    result.push("docs");
  }
  return result;
};

export const ResponsePanelTabSchema = z.enum([
  "response",
  "messages",
  "headers",
]);

export type ResponsePanelTab = z.infer<typeof ResponsePanelTabSchema>;

export const isResponsePanelTab = (tab: unknown): tab is ResponsePanelTab => {
  return ResponsePanelTabSchema.safeParse(tab).success;
};

export const getVisibleResponsePanelTabs = (route: {
  requestType: RequestType;
}): ResponsePanelTab[] => {
  if (route.requestType === "websocket") {
    return ["response", "messages", "headers"];
  }
  return ["response", "headers"];
};
