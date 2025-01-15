import { Hono } from "hono";
import tokens from "./tokens.js";

const app = new Hono();

app.route("/tokens", tokens);

export default app;
