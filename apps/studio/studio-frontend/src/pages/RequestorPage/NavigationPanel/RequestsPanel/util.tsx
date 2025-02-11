import type { ProxiedRequestResponse } from "../../queries";

export const getId = (item: ProxiedRequestResponse) => {
  return item.app_responses?.traceId || item.app_requests.id.toString();
};
