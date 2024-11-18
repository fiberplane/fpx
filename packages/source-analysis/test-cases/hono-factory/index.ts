import { Hono } from "hono";
import { createApp } from "./factory";

const app = createApp();

const subHello = new Hono();
subHello.get("/", (c) => c.text("Hello, sub!"));
subHello.get("/bye", (c) => c.text("Bye, sub!"));

app.route("/sub", subHello);

export default app;
