import { serve } from "@hono/node-server";
import { env } from "hono/adapter";
import { config } from "dotenv";
import { readFileSync } from "node:fs";

import { createApp } from "./app";
import { cors } from "hono/cors";
import { SourceMapConsumer } from "source-map";
import { findSourceFunction } from "./find-source-function";
import { WebSocket, WebSocketServer } from "ws";

config({ path: ".dev.vars" });

const wsConnections = new Set<WebSocket>();
const app = createApp(wsConnections);

app.get("/", async (c) => {
  return c.text("Hello Node.js Hono");
});

app.get("/v0/source", cors(), async (c) => {
  const { source, line, column } = c.req.query();

  try {
    const file = JSON.parse(readFileSync(source, "utf8").toString());
    const consumer = await new SourceMapConsumer(file);
    const pos = consumer.originalPositionFor({
      line: Number.parseInt(line, 10),
      column: Number.parseInt(column, 10),
    });
    consumer.destroy();

    return c.json(pos);
  } catch (err) {
    console.error("Could not read source file", err?.message);
    return c.json(
      { error: "Error reading file", name: err?.name, message: err?.message },
      500,
    );
  }
});

app.post("/v0/source-function", cors(), async (c) => {
  const { handler, source } = c.req.query();

  try {
    const functionText = await findSourceFunction(source, handler);
    return c.json({ functionText });
  } catch (err) {
    console.error("Could not find function in source", source);
    return c.json(
      {
        error: "Error finding function",
        name: err?.name,
        message: err?.message,
      },
      500,
    );
  }
});

const port = 8788;
console.log(`Server is running: http://localhost:${port}`);

const wsServer = new WebSocketServer({ port: 8789 });

wsServer.on("connection", (ws) => {
  console.log("WebSocket connection established", ws.OPEN);
  wsConnections.add(ws);

  ws.on("ping", () => {
    console.log("ping");
    ws.send("pong");
  });
  ws.on("error", console.error);
  ws.on("close", (code) => {
    wsConnections.delete(ws);
    console.log("WebSocket connection closed", code);
  });
});

serve({
  fetch: app.fetch,
  port,
});
