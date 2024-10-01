import { Hono, type HonoRequest } from "hono";
import { instrument } from "@fiberplane/hono-otel";
import otherRouter from "./other-router";
import { getAuthHeader, getRandomHeader } from "./utils";

const app = new Hono<{ Bindings: { DB: D1Database } }>();

const PASSPHRASES = ["I am a cat", "I am a dog", "I am a bird"];

app.get("/const", (c) => {
  const auth = c.req.header("Authorization");
  if (auth && PASSPHRASES.includes(auth)) {
    return c.text("Hello Hono!");
  }
  return c.text("Unauthorized", 401);
});

app.get("/helper-function", (c) => {
  const shouldSayHello = helperFunction(c.req);
  return c.text(shouldSayHello ? "Hello Helper Function!" : "Helper Function");
});

app.get("/const-and-helper-out-of-file", (c) => {
  const auth = getAuthHeader(c.req);
  if (auth && PASSPHRASES.includes(auth)) {
    return c.text("Hello Hono!");
  }
  return c.text("Unauthorized", 401);
});

app.get("/const-and-helper-out-of-file-and-sub-helpers", (c) => {
  const randomHeader = getRandomHeader(c.req);
  if (randomHeader) {
    return c.text("What a random header!");
  }
  return c.text("No random header", 422);
});

app.route("/other-router", otherRouter);

export default instrument(app);

function helperFunction(req: HonoRequest): boolean {
  return req.query("shouldSayHello") === "true";
}
