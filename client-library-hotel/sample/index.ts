import { Hono } from "hono";
import { instrument } from "../src";

const app = new Hono();

const sleep = (ms: number) =>
  new Promise<void>((resolve) =>
    setTimeout(() => {
      console.log("done");
      resolve();
    }, ms),
  );

app.get("/", async (c) => {
  c.executionCtx.waitUntil(sleep(10));
  c.executionCtx.waitUntil(sleep(20));
  return c.text("Hello Hono!");
});

export default instrument(app);
