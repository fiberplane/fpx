import { Hono } from "hono";

const FP_SERVICES_URL = "https://playground-services.mies.workers.dev";

const assistant = new Hono();
// Proxy all requests to fp-services but attach a token
assistant.all("*", async (c) => {
  const token = "only-auth";
  const url = `${FP_SERVICES_URL}${c.req.path}`;

  const contentType = c.req.header("content-type");
  const headers = new Headers();
  // Only include the bare minimum authentication and content-type headers
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("x-fpx-token", token);
  if (contentType) {
    headers.set("content-type", contentType);
  }

  return fetch(url, {
    method: c.req.method,
    headers,
    body: c.req.raw.body,
  });
});

export default assistant;
