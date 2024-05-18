import { Hono } from "hono";
import { NeonDbError, neon } from "@neondatabase/serverless";

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

app.get("db-errors", async (c) => {
	return c.json(DB_ERRORS);
});

app.post("/v0/logs", async (c) => {
	const { service, message, args } = await c.req.json();
	const sql = neon(c.env.DATABASE_URL);
	const jsonMessage = isValidJson(message) ? message : JSON.stringify(message);

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

app.get("/", async (c) => {
	const sql = neon(c.env.DATABASE_URL);
	const logs = await sql("SELECT * FROM mizu_logs");
	return c.json(logs);
});

// TODO - Otel support, would need to decode protobuf
app.post("/v1/logs", async (c) => {
	const body = await c.req.json();
	console.log(body);
	return c.json(body);
});

export default app;

function isValidJson(str: string) {
	try {
		JSON.parse(str);
		return true;
	} catch (e) {
		return false;
	}
}
