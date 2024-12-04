import { instrument } from "@fiberplane/hono-otel";
import { Hono } from "hono";

import type { WoofWorker } from "../../woof/src";

type Bindings = {
  WOOF: WoofWorker;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", async (c) => {
  const bark = await c.env.WOOF.bark({ volume: 10 });
  c.env.WOOF.sniff();
  return c.text(`Meow from above! ☁️🪿🐈 (But dog says "${bark}")`);
});

app.get("/geese-to-bark-at", async (c) => {
  const geeseResponse = await c.env.WOOF.fetch(c.req.raw);
  try {
    const geese = await geeseResponse.json();
    console.log(geese);
    return c.json(geese as Array<unknown>);
  } catch (_e) {
    return c.json({ error: "Failed to parse geese response as JSON" }, 500);
  }
});

export default instrument(app);
