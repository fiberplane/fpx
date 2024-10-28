import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { z } from "zod";
import type { HatchApp } from "../types";
import { generateName } from "./ai-name-generation";

const v1Api = new Hono<HatchApp>();

const validatePrompt = zValidator(
  "json",
  z.object({
    prompt: z.string(),
  }),
);

v1Api.post("/hatch/name", validatePrompt, async (c) => {
  const prompt = c.req.valid("json").prompt;
  const name = await generateName(c.env.AI, prompt);
  return c.json({ name }, 200);
});

v1Api.post("/hatch", async (c) => {
  const body = await c.req.json();
  const { prompt, dbType } = body;

  const logger = c.get("appLogger");
  logger.info(
    `Received hatch request with prompt: ${prompt} and dbType: ${dbType}`,
  );

  return c.json({ message: "Hatch request processed successfully" }, 200);
});

/**
 * Any uncaught exceptions thrown by a Durable Object or thrown by Durable Objects’ infrastructure
 * (such as overloads or network errors)
 * will be propagated to the callsite of the client.
 * Catching these exceptions allows you to retry creating the DurableObjectStub and sending requests.
 *
 * JavaScript Errors with the property .retryable set to True are suggested to be retried
 * if requests to the Durable Object are idempotent,
 * or can be applied multiple times without changing the response.
 * If requests are not idempotent, then you will need to decide what is best for your application.
 *
 * JavaScript Errors with the property .overloaded set to True should not be retried.
 * If a Durable Object is overloaded, then retrying will worsen the overload and increase the overall error rate.
 */
v1Api.get("/hatch/:id/status", async (c) => {
  // TODO - Look up session in the database
  const id = c.env.GOOSE_EGG.idFromName(c.req.param("id"));
  const stub = c.env.GOOSE_EGG.get(id);
  return stub.fetch(c.req.raw);
});

// HACK - Just to test the SSE endpoint, manually set the status
v1Api.post("/hatch/:id/status", async (c) => {
  // TODO - Look up session in the database
  const id = c.env.GOOSE_EGG.idFromName(c.req.param("id"));
  const stub = c.env.GOOSE_EGG.get(id);
  await stub.setStatus("finished");
  return c.json({ message: "Status set to finished" }, 200);
});

// Change to GET with query parameters
v1Api.get("/hatch/stream", async (c) => {
  const prompt = c.req.query("prompt");
  const dbType = c.req.query("dbType");

  if (!prompt || !dbType) {
    return c.json({ error: "Missing required parameters" }, 400);
  }

  return streamSSE(c, async (stream) => {
    const logger = c.get("appLogger");
    logger.info(
      `Processing stream request with prompt: ${prompt} and dbType: ${dbType}`,
    );

    try {
      // Send first event
      await stream.writeSSE({
        data: JSON.stringify({
          message: "Generated initial plan for your application",
          details: { prompt, dbType },
        }),
        event: "plan-generated",
        id: "1",
      });

      // Wait 1 second
      await stream.sleep(1000);

      // Send second event
      await stream.writeSSE({
        data: JSON.stringify({
          message: "Writing database schema",
          schema: "example_schema_here",
        }),
        event: "writing-schema",
        id: "2",
      });
    } catch (error) {
      logger.error("Error in SSE stream:", error);
    } finally {
      // Close the stream after sending both events
      stream.close();
    }
  });
});

export default v1Api;
