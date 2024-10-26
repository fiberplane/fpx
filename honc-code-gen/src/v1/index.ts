import { Hono } from "hono";
import type { HatchApp } from "../types";

const v1Api = new Hono<HatchApp>();

v1Api.post("/hatch", async (c) => {
  const body = await c.req.json();
  const { prompt, dbType } = body;

  // Placeholder logic
  const logger = c.get("appLogger");
  logger.info(`Received hatch request with prompt: ${prompt} and dbType: ${dbType}`);

  // Simulate some processing time
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Return a placeholder response
  return c.json({
    message: "Hatch request processed successfully",
    promptLength: prompt.length,
    dbType: dbType
  }, 200);
});

export default v1Api;

