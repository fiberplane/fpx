import { instrument } from "@fiberplane/hono-otel";
import { serve } from "@hono/node-server";
import { config } from "dotenv";
import { Hono } from "hono";

// Load environment variables from .env file
config();

const app = new Hono();

app.get("/", (c) => {
  console.log("Hello Hono!");
  return c.text("Hello Hono!");
});

app.get("/function", (c) => {
  helloFunction();
  console.log(helloFunction, "that was a function");
  return c.text("Hello function!");
});

function helloFunction() {
  console.log("Hello function!");
}

app.post("/json", async (c) => {
  const body = await c.req.json();
  console.log("json body", body);
  return c.json({ message: "Hello Json!", body });
});

const port = 8787;
console.log(`Server is running on port http://localhost:${port}`);

serve({
  fetch: instrument(app).fetch,
  port,
});
