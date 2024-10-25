import { FPX_AUTH_BASE_URL } from "../../constants.js";
import logger from "../../logger.js";

type FpAuthRequestOptions = {
  token: string;
  method: string;
  path: string;
  body?: Record<string, unknown>;
};

export async function makeFpAuthRequest({
  token,
  method,
  path,
  body,
}: FpAuthRequestOptions) {
  const url = new URL(path, FPX_AUTH_BASE_URL);

  logger.debug("Making FP Auth request", `method: ${method}`, `path: ${path}`);

  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const requestOptions: RequestInit = {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  };

  return fetch(url, requestOptions);
}
