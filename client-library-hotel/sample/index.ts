import { Hono } from "hono";
import { instrument, measure } from "../src";

const app = new Hono();

// Simple function that sleeps for a bit, logs the duration and returns it
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

// Simple for testing synchronous javascript execution
const loop = measure("loop", (n: number) => {
  for (let i = 0; i < n; i++) {
    console.log(`Loop iteration ${i}`);
  }
});

app.get("/", async (c) => {
  console.log("Hello Hono!");
  console.error("This message is logged as an error");

  loop(15);

  c.executionCtx.waitUntil(sleep(30));
  const response = await fetch("https://api.chucknorris.io/jokes/random");
  const result = await response.json();

  // This should execute beyond the requests time


  return c.text(`Hello Hono! - ${result.value}`);
});

export default instrument(app);
