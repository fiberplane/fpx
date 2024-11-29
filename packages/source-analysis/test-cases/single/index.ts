import { Hono } from "hono";

const app = new Hono();
const LITERAL = "literal"
app.get("/", (c) => c.text("Hello, Hono!"));
app.post('/single-quote', (c) => c.text("Hello, 'Hono'!"));
app.put(`/${LITERAL}-template-${LITERAL}-stuff`, (c) => c.text("Hello, `${Hono}`!"));

export default app;
