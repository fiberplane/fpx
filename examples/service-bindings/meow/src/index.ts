import { instrument } from "@fiberplane/hono-otel";
import { Hono } from "hono";

import type { WoofWorker } from "../../woof/src";

type Bindings = {
  WOOF: WoofWorker;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", async (c) => {
  const bark = await c.env.WOOF.bark();

  return c.text(`Meow from above! ☁️🪿🐈 (But dog says "${bark}")`);
});

export default instrument(app);
