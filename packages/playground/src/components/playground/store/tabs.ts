import { z } from "zod";
import type { RequestMethod } from "../types";

export const RequestsPanelTabSchema = z.enum([
  "params",
  "headers",
  "auth",
  "body",
  "docs",
]);

export type RequestsPanelTab = z.infer<typeof RequestsPanelTabSchema>;

export const isRequestsPanelTab = (tab: unknown): tab is RequestsPanelTab => {
  return RequestsPanelTabSchema.safeParse(tab).success;
};

export const getVisibleRequestPanelTabs = (route: {
  method: RequestMethod;
}): RequestsPanelTab[] => {
  const result: RequestsPanelTab[] = ["params", "headers", "auth"];

  const canHaveBody = route.method !== "GET" && route.method !== "HEAD";
  if (canHaveBody) {
    result.push("body");
  }

  result.push("docs");
  return result;
};

export const ResponsePanelTabSchema = z.enum(["response", "headers"]);

export type ResponsePanelTab = z.infer<typeof ResponsePanelTabSchema>;

export const isResponsePanelTab = (tab: unknown): tab is ResponsePanelTab => {
  return ResponsePanelTabSchema.safeParse(tab).success;
};

export const getVisibleResponsePanelTabs = (): ResponsePanelTab[] => {
  return ["response", "headers"];
};
