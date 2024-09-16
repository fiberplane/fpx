// import { GlobalResponse } from "../types";

export function cloneResponse(response: Response) {
  const [a = null, b = null] = response.body ? response.body.tee() : [];

  return [
    createResponseWithBody(response, a),
    createResponseWithBody(response, b),
  ] as const;
}

export function createResponseWithBody(
  response: Response,
  newBody: Response["body"],
) {
  return new Response(newBody, {
    headers: response.headers,
    status: response.status,
    statusText: response.statusText,
  });
}
