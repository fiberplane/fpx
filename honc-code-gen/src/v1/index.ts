import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
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

  // Placeholder logic
  const logger = c.get("appLogger");
  logger.info(
    `Received hatch request with prompt: ${prompt} and dbType: ${dbType}`,
  );

  // Simulate some processing time
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Return a placeholder response
  return c.json(
    {
      message: "Hatch request processed successfully",
      promptLength: prompt.length,
      dbType: dbType,
    },
    200,
  );
});

export default v1Api;
