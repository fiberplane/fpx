import { Hono } from "hono";
import { instrument, measure } from "../src";

const app = new Hono();

const sleep = measure("sleep", (ms: number) => {
  const start = Date.now();
  return new Promise<number>((resolve) =>
    setTimeout(() => {
      const duration = Date.now() - start;
      console.log(`Slept for ${duration}ms`);
      resolve(duration);
    }, ms),
  );
});

const loop = measure("loop", (n: number) => {
  for (let i = 0; i < n; i++) {
    console.log(`Loop iteration ${i}`);
  }
});

app.get("/", async (c) => {
  console.log("Hello Hono!");
  console.error("This is an error");
  // This should execute beyond the requests time
  c.executionCtx.waitUntil(sleep(10));
  loop(15);
  return c.text("Hello Hono!");
});

export default instrument(app);
