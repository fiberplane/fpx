import { z } from "zod";
import { RequestMethod, RequestType } from "../types";

export const RequestsPanelTabSchema = z.enum([
  "params",
  "headers",
  "body",
  "messages",
]);

export type RequestsPanelTab = z.infer<typeof RequestsPanelTabSchema>;

export const isRequestsPanelTab = (tab: unknown): tab is RequestsPanelTab => {
  return RequestsPanelTabSchema.safeParse(tab).success;
};

export const getVisibleRequestPanelTabs = (route: {
  requestType: RequestType;
  method: RequestMethod;
}): RequestsPanelTab[] => {
  if (route.requestType === "websocket") {
    return ["params", "headers", "messages"];
  }
  if (route.method === "GET" || route.method === "HEAD") {
    return ["params", "headers"];
  }
  return ["params", "headers", "body"];
};

export const ResponsePanelTabSchema = z.enum([
  "body",
  "headers",
  "messages",
  "debug",
  "history",
]);

export type ResponsePanelTab = z.infer<typeof ResponsePanelTabSchema>;

export const isResponsePanelTab = (tab: unknown): tab is ResponsePanelTab => {
  return ResponsePanelTabSchema.safeParse(tab).success;
};

export const getVisibleResponsePanelTabs = (route: {
  requestType: RequestType;
}): ResponsePanelTab[] => {
  if (route.requestType === "websocket") {
    return ["body", "headers", "messages", "debug", "history"];
  }
  return ["body", "headers", "debug", "history"];
};
