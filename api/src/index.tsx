import { Hono } from "hono";
import { cors } from 'hono/cors'
import { drizzle } from 'drizzle-orm/neon-http';
import { NeonDbError, neon } from "@neondatabase/serverless";
import { Messages } from "./components";

type Bindings = {
	DATABASE_URL: string;
};

const app = new Hono<{ Bindings: Bindings }>();

const DB_ERRORS: Array<NeonDbError> = [];

app.use(async (c, next) => {
	try {
		await next();
	} catch (err) {
		console.error(err);
		return c.json({ error: "Internal server error" }, 500);
	}
});

app.post("/v0/logs", async (c) => {
	const { service, message, args } = await c.req.json();
	const sql = neon(c.env.DATABASE_URL);
	const db = drizzle(sql);

	const jsonMessage = isJsonParseable(message) ? message : JSON.stringify(message);

	try {
		await sql("insert into mizu_logs (message) values ($1)", [jsonMessage]);
		return c.text("OK");
	} catch (err) {
		if (err instanceof NeonDbError) {
			console.log("DB ERROR FOR:", { message, jsonMessage });
			DB_ERRORS.push(err);
		}
		return c.json({ error: "Error processing log data" }, 500);
	}
});

// Data equivalent of home page (for a frontend to consume)
app.get("/v0/logs", cors(), async (c) => {
	const sql = neon(c.env.DATABASE_URL);
	const logs = await sql("SELECT * FROM mizu_logs");
	return c.json({ 
		logs
	});
});

// Home page
app.get("/", async (c) => {
	const sql = neon(c.env.DATABASE_URL);
	const logs = await sql("SELECT * FROM mizu_logs");
	return c.html(<Messages logs={logs} />);
});

// HACK - Route to inspect any db errors during this session
app.get("db-errors", async (c) => {
	return c.json(DB_ERRORS);
});

// TODO - Otel support, would need to decode protobuf
app.post("/v1/logs", async (c) => {
	const body = await c.req.json();
	console.log(body);
	return c.json(body);
});

export default app;

/**
 * Check if value is json-parseable
 */
function isJsonParseable(str: string) {
	try {
		JSON.parse(str);
		return true;
	} catch (e) {
		return false;
	}
}
