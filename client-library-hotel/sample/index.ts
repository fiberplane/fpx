import { Hono } from "hono";
import { instrument } from "../src";
import { measure } from "../src/util";

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

app.get("/", async (c) => {
  console.log("Hello Hono!");
  c.executionCtx.waitUntil(sleep(10));
  return c.text("Hello Hono!");
});

export default instrument(app);
