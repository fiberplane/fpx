export type RequestMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "OPTIONS"
  | "PATCH"
  | "HEAD";
export type RequestMethodInputValue = RequestMethod | "WS";
