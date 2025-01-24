import { Hono } from "hono";

const workflows = new Hono();
// Proxy all requests to fp-services but attach a token
workflows.all("*", (c) => {
  const token = "only-auth";
  // FIXME: probably don't want to hardcode this
  const url = `http://localhost:7676${c.req.path}`;

  const headers = new Headers(c.req.raw.headers);
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("x-fpx-token", token);

  return fetch(url, {
    method: c.req.method,
    headers,
    body: c.req.raw.body,
  });
});

export default workflows;
