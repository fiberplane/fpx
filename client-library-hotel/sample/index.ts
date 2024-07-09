import { trace } from "@opentelemetry/api";
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
  console.log("span active during route?", !!trace.getActiveSpan());
  c.executionCtx.waitUntil(sleep(10));
  c.executionCtx.waitUntil(sleep(20));
  return c.text("Hello Hono!");
});

export default instrument(app);
