export type RequestMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "OPTIONS"
  | "PATCH"
  | "HEAD";

export type RequestMethodInputValue = RequestMethod | "WS";

export type RequestType = "http" | "websocket";

export const isWsRequest = (requestType: RequestType) =>
  requestType === "websocket";
