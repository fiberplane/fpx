import { serve } from "@hono/node-server";
import app from "./app.js";

const port = 3000;
console.log(`Server is running on port ${port}`);

serve({
  // @ts-expect-error: https://linear.app/fiberplane/issue/FP-4036/otel-client-library-node-apps-dont-like-the-type-we-give-to-appfetch
  fetch: app.fetch,
  port,
});
