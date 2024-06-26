import { Context, Hono } from "hono";
// import { Mizu, logger } from "mizu";
import { createHonoMiddleware } from "../src/index";

const app = new Hono();

app.use(createHonoMiddleware());

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

export default app;
