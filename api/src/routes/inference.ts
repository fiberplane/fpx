import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { cors } from "hono/cors";
import OpenAI from "openai";
import { z } from "zod";
import { generateRequestWithAiProvider } from "../lib/ai/index.js";
import { cleanPrompt } from "../lib/ai/prompts.js";
import { getAllSettings, getInferenceConfig } from "../lib/settings/index.js";
import type { Bindings, Variables } from "../lib/types.js";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.post("/v0/generate-request", cors(), async (ctx) => {
  const { handler, method, path, history, persona, openApiSpec } =
    await ctx.req.json();

  const db = ctx.get("db");
  const inferenceConfig = await getInferenceConfig(db);

  if (!inferenceConfig) {
    return ctx.json(
      {
        message: "No inference configuration found",
      },
      403,
    );
  }

  const { data: parsedArgs, error: generateError } =
    await generateRequestWithAiProvider({
      inferenceConfig,
      persona,
      method,
      path,
      handler,
      history,
      openApiSpec,
    });

  if (generateError) {
    return ctx.json({ message: generateError.message }, 500);
  }

  return ctx.json({
    request: parsedArgs,
  });
});

app.post(
  "/v0/analyze-error",
  cors(),
  zValidator(
    "json",
    z.object({ errorMessage: z.string(), handlerSourceCode: z.string() }),
  ),
  async (ctx) => {
    const { handlerSourceCode, errorMessage } = ctx.req.valid("json");

    const db = ctx.get("db");
    const inferenceConfig = await getInferenceConfig(db);
    if (!inferenceConfig) {
      return ctx.json(
        {
          error: "No OpenAI configuration found",
        },
        403,
      );
    }
    const { openaiApiKey, openaiModel } = inferenceConfig;
    const openaiClient = new OpenAI({
      apiKey: openaiApiKey,
    });
    const response = await openaiClient.chat.completions.create({
      model: openaiModel ?? "gpt-4o", // TODO - Update this to use correct model and provider (later problem)
      messages: [
        {
          role: "system",
          content: cleanPrompt(`
            You are a code debugging assistant for apps that use Hono (web framework),
            Neon (serverless postgres), Drizzle (ORM), and run on Cloudflare workers.
            You are given a function and an error message.
            Provide a succinct suggestion to fix the error, or say "I need more context to help fix this".
          `),
        },
        {
          role: "user",
          content: cleanPrompt(`
            I hit the following error:
            ${errorMessage}
            This error originated in the following route handler for my Hono application:
            ${handlerSourceCode}
          `),
        },
      ],
      temperature: 0,
      max_tokens: 2048,
    });

    const {
      choices: [{ message }],
    } = response;

    return ctx.json({
      suggestion: message.content,
    });
  },
);

export default app;
