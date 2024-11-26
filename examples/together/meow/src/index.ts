import { instrument } from "@fiberplane/hono-otel";
import { Hono } from "hono";

export interface MeowWorker {
  add(a: number, b: number): Promise<number>;
}

type Bindings = {
  WORKER: MeowWorker;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", async (c) => {
  const num = await c.env.WORKER.add(1, 2);

  return c.text(`Honc from above! ☁️🪿 (${num})`);
});

export default instrument(app);
