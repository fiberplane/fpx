import { Hono } from "hono";

const bye = new Hono();
bye.get("/bye", (c) => c.text("Bye, sub!"));

export default bye;
