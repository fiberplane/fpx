import { Hono } from "hono";
import { SuccessPage } from "../components/SuccessPage";
import { generateNonce } from "./utils";

const app = new Hono();

/**
 * A test route to preview the success page locally.
 * Mount this router in index.tsx and then go to `/test`
 */
app.get("/test", async (c) => {
  const token = `test-${crypto.randomUUID()}`;
  const expiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000,
  ).toISOString();
  // Generate a unique nonce for each request
  const nonce = generateNonce();

  // Set CSP header
  c.header("Content-Security-Policy", `script-src 'nonce-${nonce}'`);

  return c.render(
    <SuccessPage nonce={nonce} token={token} expiresAt={expiresAt} />,
  );
});

export default app;
