import { z } from "zod";
import { ProbedRoute } from "../queries";
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

export const getVisibleTabsForRoute = (route: {
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
