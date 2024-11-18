import { Hono } from "hono";

const silence = new Hono();
silence.get("/", (c) => c.text("..."));

export { silence };
